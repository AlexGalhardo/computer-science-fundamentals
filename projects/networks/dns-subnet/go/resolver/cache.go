// Package resolver is an iterative DNS resolver with a cache that respects the time to live.
package resolver

import (
	"time"

	"dns-subnet/dnsmsg"
)

type key struct {
	name string
	kind dnsmsg.Type
}

type entry struct {
	records []dnsmsg.Record
	expires time.Time
}

// Cache remembers record sets until their time to live runs out. It is meant for one
// goroutine: the resolver of this mini-project handles one question at a time.
type Cache struct {
	now     func() time.Time
	entries map[key]entry
}

// NewCache creates a cache. The clock is a parameter so tests can move time forward
// without sleeping; nil means the real clock.
func NewCache(now func() time.Time) *Cache {
	if now == nil {
		now = time.Now
	}
	return &Cache{now: now, entries: map[key]entry{}}
}

// Put stores records that share one name and one type.
//
// EN: The time to live is chosen by the owner of the data, not by the cache. It says for how
// long the answer may be reused without asking again. The set expires when its shortest TTL
// does, and a TTL of zero means "do not cache".
// PT: O tempo de vida é escolhido pelo dono do dado, não pelo cache. Ele diz por quanto tempo
// a resposta pode ser reutilizada sem perguntar de novo. O conjunto expira junto com o seu
// menor TTL, e um TTL de zero significa "não guarde".
// ES: El tiempo de vida lo elige el dueño del dato, no la caché. Dice por cuánto tiempo la
// respuesta puede reutilizarse sin volver a preguntar. El conjunto expira junto con su menor
// TTL, y un TTL de cero significa "no lo guardes".
func (c *Cache) Put(records []dnsmsg.Record) {
	if len(records) == 0 {
		return
	}
	ttl := records[0].TTL
	for _, record := range records {
		ttl = min(ttl, record.TTL)
	}
	if ttl == 0 {
		return
	}
	stored := append([]dnsmsg.Record(nil), records...)
	c.entries[key{records[0].Name, records[0].Type}] = entry{
		records: stored,
		expires: c.now().Add(time.Duration(ttl) * time.Second),
	}
}

// Get returns a cached record set that has not expired, with the TTL that is left.
func (c *Cache) Get(name string, kind dnsmsg.Type) ([]dnsmsg.Record, bool) {
	k := key{name, kind}
	found, ok := c.entries[k]
	if !ok {
		return nil, false
	}
	left := found.expires.Sub(c.now())
	if left <= 0 {
		delete(c.entries, k)
		return nil, false
	}
	// EN: A cached answer is handed on with the time it has left, not with its original TTL.
	//     Otherwise a chain of caches would keep an old record alive far beyond what its
	//     owner allowed.
	// PT: Uma resposta em cache é repassada com o tempo que lhe resta, não com o TTL original.
	//     Do contrário uma cadeia de caches manteria um registro antigo vivo muito além do que
	//     o dono permitiu.
	// ES: Una respuesta en caché se entrega con el tiempo que le queda, no con el TTL original.
	//     De lo contrario una cadena de cachés mantendría vivo un registro viejo mucho más allá
	//     de lo que permitió el dueño.
	seconds := uint32((left + time.Second - 1) / time.Second)
	records := make([]dnsmsg.Record, len(found.records))
	for i, record := range found.records {
		record.TTL = seconds
		records[i] = record
	}
	return records, true
}
