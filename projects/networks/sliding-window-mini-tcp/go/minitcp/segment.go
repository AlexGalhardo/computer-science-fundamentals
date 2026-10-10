// Package minitcp is a small reliable transport built on UDP: three-way handshake, byte
// sequence numbers, cumulative acknowledgements, retransmission and an orderly close.
package minitcp

import (
	"encoding/binary"
	"errors"
	"hash/crc32"
)

// MSS is the largest payload of one segment, small enough to fit in one UDP datagram
// without IP fragmentation on an ordinary link.
const MSS = 1200

const (
	flagSYN byte = 1 << iota
	flagACK
	flagFIN
)

const (
	headerSize  = 1 + 4 + 4 + 4 + 2
	trailerSize = 4
)

// segment is the unit exchanged by the two ends.
//
// EN: As in TCP, seq numbers the first byte of the payload and ack is the next byte the
// receiver expects, so an acknowledgement is cumulative. sack is not in classic TCP headers:
// it names the one segment that triggered this ACK, which selective repeat needs.
// PT: Como no TCP, seq numera o primeiro byte dos dados e ack é o próximo byte que o receptor
// espera, de modo que a confirmação é cumulativa. sack não existe no cabeçalho clássico do TCP:
// ele nomeia o segmento que provocou este ACK, algo de que a retransmissão seletiva precisa.
// ES: Como en TCP, seq numera el primer byte de los datos y ack es el siguiente byte que espera el
// receptor, de modo que la confirmación es acumulativa. sack no existe en el encabezado clásico de
// TCP: nombra el segmento que provocó este ACK, algo que la repetición selectiva necesita.
type segment struct {
	flags   byte
	seq     uint32
	ack     uint32
	sack    uint32
	payload []byte
}

var errCorrupt = errors.New("corrupt segment")

func (s segment) marshal() []byte {
	buf := make([]byte, headerSize, headerSize+len(s.payload)+trailerSize)
	buf[0] = s.flags
	binary.BigEndian.PutUint32(buf[1:], s.seq)
	binary.BigEndian.PutUint32(buf[5:], s.ack)
	binary.BigEndian.PutUint32(buf[9:], s.sack)
	binary.BigEndian.PutUint16(buf[13:], uint16(len(s.payload)))
	buf = append(buf, s.payload...)
	// EN: UDP already has a checksum, but it is weak and optional in IPv4. A CRC over header
	// and payload lets the receiver drop a damaged segment, which then looks like a loss.
	// PT: O UDP já tem um checksum, mas ele é fraco e opcional no IPv4. Um CRC sobre cabeçalho
	// e dados permite ao receptor descartar um segmento danificado, que passa a ser uma perda.
	// ES: UDP ya tiene un checksum, pero es débil y opcional en IPv4. Un CRC sobre el encabezado
	// y los datos permite al receptor descartar un segmento dañado, que pasa a ser una pérdida.
	return binary.BigEndian.AppendUint32(buf, crc32.ChecksumIEEE(buf))
}

func unmarshal(buf []byte) (segment, error) {
	if len(buf) < headerSize+trailerSize {
		return segment{}, errCorrupt
	}
	body, sum := buf[:len(buf)-trailerSize], binary.BigEndian.Uint32(buf[len(buf)-trailerSize:])
	if crc32.ChecksumIEEE(body) != sum {
		return segment{}, errCorrupt
	}
	length := int(binary.BigEndian.Uint16(body[13:]))
	if length != len(body)-headerSize {
		return segment{}, errCorrupt
	}
	return segment{
		flags:   body[0],
		seq:     binary.BigEndian.Uint32(body[1:]),
		ack:     binary.BigEndian.Uint32(body[5:]),
		sack:    binary.BigEndian.Uint32(body[9:]),
		payload: append([]byte(nil), body[headerSize:]...),
	}, nil
}

// distance returns how many bytes seq is after origin, negative when it is before.
//
// EN: Sequence numbers are 32 bits and wrap around. Subtracting as unsigned and reading the
// result as signed gives the right distance as long as the two numbers are less than 2^31
// apart, which a window always is.
// PT: Os números de sequência têm 32 bits e dão a volta. Subtrair como inteiro sem sinal e ler
// o resultado com sinal dá a distância correta enquanto os dois números estiverem a menos de
// 2^31 um do outro, o que sempre vale dentro de uma janela.
// ES: Los números de secuencia tienen 32 bits y dan la vuelta. Restar como entero sin signo y leer
// el resultado con signo da la distancia correcta mientras los dos números estén a menos de
// 2^31 uno del otro, lo que siempre se cumple dentro de una ventana.
func distance(seq, origin uint32) int {
	return int(int32(seq - origin))
}
