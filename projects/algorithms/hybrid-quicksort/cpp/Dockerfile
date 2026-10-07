FROM gcc:16.2.0-trixie
WORKDIR /app
COPY . .
RUN g++ -std=c++23 -Wall -Wextra -Werror -O2 test_quicksort.cpp -o test_quicksort && g++ -std=c++23 -Wall -Wextra -Werror -O2 main.cpp -o bench
CMD ["./test_quicksort"]
