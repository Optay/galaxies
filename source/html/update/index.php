<?php
putenv('PATH=/usr/local/bin:/bin:/usr/bin:/opt/aws/bin');
exec('cd ../../; res="$(git pull)"; echo -e "$res"; if [ "$res" != "Already up-to-date." ]; then grunt build; fi', $output, $returnCode);

if (empty($_POST)) {
  $termMarkerFind = array('[4m', '[24m', '[32m', '[39m');
  $termMarkerReplace = array('<u>', '</u>', '<span style="color:green;">', '</span>');

  foreach ($output as $value) {
    echo str_replace($termMarkerFind, $termMarkerReplace, $value) . "<br>\n";
  }
}
