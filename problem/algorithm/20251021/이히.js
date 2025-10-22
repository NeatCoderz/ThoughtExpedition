/**
 * 30분 내 실패
 * 전체 시간복잡도: O(n log n + n*m)..?
 */
function solution(clothes) {
  var answer = 1;

  var typeArr = [...new Set(clothes.map(([, type]) => type))];

  typeArr.forEach((type) => {
    // 아예 안입었던 케이스도 포햄해서 생각했어야함
    var item = clothes.filter(([item, _type]) => _type == type).length + 1;
    answer = item * answer;
  });

  return answer - 1;
}

var case1 = [
  ['yellow_hat', 'headgear'],
  ['blue_sunglasses', 'eyewear'],
  ['green_turban', 'headgear'],
];

var case2 = [
  ['crow_mask', 'face'],
  ['blue_sunglasses', 'face'],
  ['smoky_makeup', 'face'],
];

var case3 = [
  ['yellow_hat', 'headgear'],
  ['blue_sunglasses', 'eyewear'],
  ['green_turban', 'headgear'],
  ['red_sunglasses', 'eyewear'],
];

var case4 = [
  ['a', 'A'],
  ['b', 'B'],
  ['c', 'C'],
  ['d', 'D'],
  ['e', 'E'],
  ['f', 'F'],
  ['g', 'G'],
  ['h', 'H'],
  ['i', 'I'],
  ['j', 'J'],
  ['k', 'K'],
  ['l', 'L'],
  ['m', 'M'],
  ['n', 'N'],
  ['o', 'O'],
  ['p', 'P'],
  ['q', 'Q'],
  ['r', 'R'],
  ['s', 'S'],
  ['t', 'T'],
  ['u', 'U'],
  ['v', 'V'],
  ['w', 'W'],
  ['x', 'X'],
  ['y', 'Y'],
  ['z', 'Z'],
  ['ab', 'AB'],
  ['ac', 'AC'],
  ['ad', 'AD'],
  ['ae', 'AE'],
];

console.log('case1 >>> ', solution(case1) === 5); // 5
console.log('case2 >>> ', solution(case2) === 3); // 3
console.log('case3 >>> ', solution(case3) === 8); // 8
console.log('case4 >>> ', solution(case4) === 1073741823); // 1073741823
