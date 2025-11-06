<!DOCTYPE html>
<html>
<head>
  <title>{{ $title }}</title>
</head>
<body>
  <h1>{{ $heading }}</h1>
  <p>{{ $message }}</p>
  @if($showFooter)
    <footer>{{ $footer }}</footer>
  @endif
</body>
</html>
