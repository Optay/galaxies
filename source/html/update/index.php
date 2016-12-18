<?php
putenv('PATH=/usr/local/bin:/bin:/usr/bin:/opt/aws/bin');
exec('cd ../../; if [ "$(git pull)" != "Already up-to-date." ]; then grunt build; fi', $output, $returnCode);

if (empty($_POST)) {
  foreach ($output as $value) {
    echo $value . "<br>\n";
  }
}
