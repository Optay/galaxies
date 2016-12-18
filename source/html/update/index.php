<?php
putenv('PATH=/usr/local/bin:/bin:/usr/bin:/opt/aws/bin');
exec('cd ../../; git pull && grunt build', $output, $returnCode);

foreach ($output as $value) {
  echo $value . "\n";
}
