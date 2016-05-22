<?php

$loginID = "gnantz";
$loginPass = "9e37a706cb9f01cf1bf9762f574be202";
$loggedIn = false;

if (!isset($_SESSION["userID"])) {
    if (isset($_POST["username"])) {
        if ($_POST["username"] == $loginID && md5($_POST["pass"]) == $loginPass) {
            $_SESSION["userID"] = 4370298374;
            $loggedIn = true;
        }
    }
} else {
    $loggedIn = true;
}

if (!$loggedIn) {
    echo '<form method="post">' .
        '<input type="text" name="username"/><br>' .
        '<input type="password" name="pass"/>' .
        '<input type="submit" value="Login"/>' .
        '</form>';
}
