# EN: Builds the C++ implementation of one workload. The build context is the workload folder,
#     so the same Dockerfile serves every workload. The binary lives in /opt/bench, inside the
#     image, so a run never reads the program through the slow bind mount of the host.
# PT: Compila a implementação em C++ de uma carga de trabalho. O contexto de build é a pasta da
#     carga, então o mesmo Dockerfile serve para todas. O binário fica em /opt/bench, dentro da
#     imagem, então a execução nunca lê o programa pelo bind mount lento do host.
# ES: Compila la implementación en C++ de una carga de trabajo. El contexto de build es la carpeta
#     de la carga, así el mismo Dockerfile sirve para todas. El binario queda en /opt/bench, dentro
#     de la imagen, así la ejecución nunca lee el programa por el bind mount lento del host.
FROM gcc:16.2.0-trixie
WORKDIR /src
COPY cpp/ .
# EN: -ffp-contract=off forbids fusing a*b+c into one instruction, which would round differently
#     and break the checksum shared with the other languages.
# PT: -ffp-contract=off proíbe fundir a*b+c em uma instrução só, o que arredondaria diferente e
#     quebraria o checksum compartilhado com as outras linguagens.
# ES: -ffp-contract=off prohíbe fusionar a*b+c en una sola instrucción, lo que redondearía distinto
#     y rompería el checksum compartido con los otros lenguajes.
RUN mkdir -p /opt/bench \
	&& g++ -std=c++23 -O2 -ffp-contract=off -Wall -Wextra -Werror -pthread main.cpp -o /opt/bench/main
