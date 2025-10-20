function solution(phone_book) {
  return !phone_book
    // O(n log n)
    .sort()
    // O(n)
    .some((item, i) => {
      return i < phone_book.length - 1 && phone_book[i + 1].startsWith(item); // O(m) 글자수에 따른 시간 복잡도
    });
}
// 전체 시간복잡도: O(n log n + n*m)..?

console.log('1 false /', solution(['119', '97674223', '1195524421'])); // false
console.log('2 true /', solution(['123', '456', '789'])); // true
console.log('3 false /', solution(['12', '123', '1235', '567', '88'])); // false
console.log('4 false /', solution(['119', '11', '91373', '1973'])); // false
console.log('5 true /', solution(['123', '2345', '23467'])); // true
console.log('6 true /', solution(['112', '119', '912'])); // true
console.log('7 false /', solution(['123', '456', '4567'])); // false
