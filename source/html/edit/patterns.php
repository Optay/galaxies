<html>
<head>
    <meta charset="UTF-8">
    <title>Pattern Editor</title>
    <link type="text/css" rel="stylesheet" href="../css/editor.css">
</head>
<body>
<?php
session_start();

include "_login.php";

if (isset($_SESSION["userID"])) {
    $savedMessage = '';

    $patterns = '';

    if (isset($_POST["patterns"])) {
        $result = file_put_contents('../js/obstaclePatterns.js', $_POST["patterns"]);

        $patterns = htmlspecialchars($_POST["patterns"]);

        if ($result) {
            $saved = true;
            $savedMessage = 'Changes saved.';
        } else {
            $savedMessage = 'Changes not saved.';
        }
    } else {
        $patterns = htmlspecialchars(file_get_contents('../js/obstaclePatterns.js'));
    }

    echo '<form method="post">' .
        '<textarea class="codeEditor" name="patterns">' . $patterns . '</textarea><br>' .
        '<div class="pushRight">' . $savedMessage . '<input type="submit" value="Save"/></div>' .
        '</form>';
}
?>
</body>
</html>
