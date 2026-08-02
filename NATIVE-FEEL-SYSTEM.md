# Native Feel System

## Toast
```js
showToast({
  type: 'success',
  icon: '✅',
  title: 'נשמר',
  message: 'הפעולה הושלמה'
});
```

Types: `success`, `favorite`, `achievement`, `prediction`, `info`, `error`.

## Celebration
```js
showCelebration({
  icon: '🏆',
  title: 'כל הכבוד!',
  message: 'פתחתם הישג חדש.'
});
```

## Skeleton
`scanImageSkeletons()` scans all supported image containers automatically.
