FROM gcc:16.2.0-trixie
WORKDIR /app
COPY . .
RUN g++ -std=c++23 -Wall -Wextra -Werror -O2 test_sorts.cpp -o test_sorts && g++ -std=c++23 -Wall -Wextra -Werror -O2 bench.cpp -o bench
CMD ["./test_sorts"]
