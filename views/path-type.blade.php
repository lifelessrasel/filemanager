if [ -f {!! escapeshellarg($path) !!} ]; then
  echo file
elif [ -d {!! escapeshellarg($path) !!} ]; then
  echo directory
else
  echo missing
fi
