<?php
/*
    OmnomIRC COPYRIGHT 2010,2011 Netham45
                       2012-2014 Sorunome

    This file is part of OmnomIRC.

    OmnomIRC is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    OmnomIRC is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with OmnomIRC.  If not, see <http://www.gnu.org/licenses/>.
*/
error_reporting(E_ALL);
ini_set('display_errors','1');

$textmode = true; // else omnomirc.php will set json headers
include_once(realpath(dirname(__FILE__)).'/config.php');
if(!$config['info']['installed']){
	if(file_exists(realpath(dirname(__FILE__)).'/updater.php')){
		header('Location: updater.php');
		die();
	}else{
		die('OmnomIRC not installed');
	}
}
include_once(realpath(dirname(__FILE__)).'/omnomirc.php');


function getPage($title,$head,$body,$page){
	global $config,$networks,$you;
	$ess = $networks->get($you->getNetwork());
	$ess = $ess['config']['externalStyleSheet'];
	return '<!DOCTYPE html>'.
			'<html>'.
			'<head>'.
				'<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />'.
				'<link rel="icon" type="image/png" href="omni.png">'.
				'<link rel="stylesheet" type="text/css" href="style.css" />'.
				($ess!=''?'<link rel="stylesheet" type="text/css" href="'.$ess.'" />':'').
				'<script src="btoa.js"></script>'.
				'<script type="text/javascript" src="jquery-1.11.0.min.js"></script>'.
				'<script src="omnomirc.js"></script>'.
				'<title>'.$title.'</title>'.
				$head.
			'</head>'.
			'<body page="'.$page.'">'.
				$body.
			'</body>'.
			'</html>';
}
if(strpos($_SERVER['HTTP_USER_AGENT'],'textmode;')!==false || isset($_GET['textmode'])){
	$cl = $networks->get($you->getNetwork());
	$cl = $cl["config"]["checkLogin"];
	$ts = time();
	header('Location: '.$cl.'?textmode&sid='.urlencode(htmlspecialchars(str_replace(";","%^%",hash("sha512",$_SERVER["REMOTE_ADDR"].$config["security"]["sigKey"].$ts)."|".$ts))).'&network='.$you->getNetwork());
}elseif(isset($_GET['options'])){
/*
Options:
1 - highlight bold
2 - highlight red
3 - color names
4 - currentChannel
5 - enabled
6 - alternating line highlight
7 - enable chrome notifications
8 - ding on highlight
9 - show extra channels
10 - show timestamps
11 - show updates in status bar
12 - show smileys
13 - highlight number chars
14 - hide userlist
15 - show scrollbar
16 - enable main-window scrolling
17 - show omnomirc join/part messages
*/
echo getPage('OmnomIRC Options','
<style type="text/css">
body,td,tr,pre,table{
	font-size: 13px;font-family:verdana,sans-serif;line-height:17px;
}
td
{
	width:auto;
	height:20px;
	white-space: inherit;
	word-wrap: inherit;
}
table
{
	height:auto;
}
tr td:nth-child(4) {
	padding-left:10px;
}
tr td:nth-child(2) {
	border-right:1px solid;
}
tr td:nth-child(5) {
	border-right:1px solid;
}
#options {
	overflow-y:auto;
}
</style>
','
<div style="font-size:20px;font-weight:bold;margin-top:5px;">OmnomIRC Options</div>
<div id="options"></div>
<div style="top:100%;margin-top:-33pt;position:absolute;"><a href="index.php"><span style="font-size:30pt;">&#8592;</span><span style="font-size:18pt;top:-3pt;position:relative;">Back<span></a></div>
<div id="icons" style="right:5px;">
	<span id="warnings" style="display:none;">
	<span class="count">0</span><span class="icon"></span>
	</span>
	<span id="errors" style="display:none;">
	&nbsp;<span class="count">0</span><span class="icon"></span>
	</span>
</div>
','options');
}elseif(isset($_GET['admin']) || !$config['info']['installed']){
echo getPage('OmnomIRC admin pannel','
<link rel="stylesheet" type="text/css" href="FlexiJsonEditor/jsoneditor.css" />
<script src="FlexiJsonEditor/jquery.jsoneditor.min.js"></script>
','
<div id="container">
<div style="font-weight:bold;">OmnomIRC Admin Pannel</div>
<div id="adminNav"><a page="index">Index</a> | <a page="channels">Channels</a> | <a page="hotlinks">Hotlinks</a> | <a page="smileys">Smileys</a> | <a page="networks">Networks</a> | <a page="sql">SQL</a> | <a page="op">Ops</a> | <a page="misc">Misc</a></div>
<div id="adminContent" style="overflow-y:auto;">Loading...</div>
</div>
<div id="adminFooter"><a href="index.php">Back to OmnomIRC</a></div>

<div id="icons" style="right:5px;">
	<span id="warnings" style="display:none;">
	<span class="count">0</span><span class="icon"></span>
	</span>
	<span id="errors" style="display:none;">
	&nbsp;<span class="count">0</span><span class="icon"></span>
	</span>
</div>
','admin');
}else{
$hotlinksHTML = '';
$i = true;


foreach($vars->get('hotlinks') as $link){
	if($i){
		$hotlinksHTML .= '<tr>';
	}
	$hotlinksHTML .= '<td><a ';
	foreach($link as $key => $value)
		if($key!='inner')
			$hotlinksHTML .= $key.'="'.$value.'" ';
	$hotlinksHTML .= '>'.$link['inner'].'</a></td>';
	if(!$i){
		$hotlinksHTML .= '</tr>';
	}
	$i = !$i;
}
if($i){
	$hotlinksHTML .= '<tr style="display:none;" id="adminLink"><td><a href="?admin">Admin</a></td>';
}else{
	$hotlinksHTML .= '<td style="display:none;" id="adminLink"><a href="?admin">Admin</a></td>';
}
$hotlinksHTML .= '</tr>';
echo getPage('OmnomIRC','
<script type="text/javascript">
document.domain="'.$config['settings']['hostname'].'"
</script>
','
<div class="windowbg2" id="windowbg2">
<div id="chattingHeader" style="margin:0;padding:0;height:39px;">
	<div id="Channels">
		<div id="ChanListButtons">
			<span style="font-size:10pt;" class="arrowButton" id="arrowLeftChan">&#9668;</span>
			<span style="font-size:10pt;" class="arrowButton" id="arrowRightChan">&#9658;</span>
		</div>
		<div id="ChanListCont">
			<div id="ChanList"></div>
		</div>
	</div>
	<div id="topicbox">
		<div id="TopicButtons">
			<span style="font-size:8pt;" class="arrowButton" id="arrowLeftTopic">&#9668;</span>
			<span style="font-size:8pt;" class="arrowButton" id="arrowRightTopic">&#9658;</span>
		</div>
		<div id="topicCont">
			<div id="topic" style="white-space:nowrap;"></div>
		</div>
	</div>
</div>
<div id="logsHeader" style="margin:0;padding:0;height:39px;display:none;">
	<b>Log viewer</b> (<a id="logCloseButton">Close</a>)<br>
	Channel: <span id="logChanIndicator"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Day: <input type="text" id="logDate"><a id="logGoButton">Go</a>
</div>

<div id="mBoxCont">
	<table id="MessageBox" cellpadding="0px" cellspacing="0px" style="width:100%;height:inherit;">
	</table>
</div>
<div id="UserListContainer">
	<table id="hotlinks">
		'.$hotlinksHTML.'
	</table>
	<div id="UserListInnerCont"><div id="UserList"></div></div>
</div>
</div>
</div>
<img id="smileyMenuButton" src="smileys/smiley.gif" style="margin-left:2px;margin-right:2px;"><form style="Display:inline;" name="irc" action="javascript:void(0)" id="sendMessage"><input autocomplete="off" accesskey="i" type="text" name="message" id="message" size="128" maxlength="256" alt="OmnomIRC" title="OmnomIRC"/><input type="submit" value="Send" id="send" /></form>
<div id="icons">
	<span id="warnings" style="display:none;">
	<span class="count">0</span><span class="icon"></span>
	</span>
	<span id="errors" style="display:none;">
	&nbsp;<span class="count">0</span><span class="icon"></span>
	</span>
</div>
<div id="about" style="display:none;"><div style="position: relative; left: -50%;"><span style="position:absolute;z-index:9002;top:1px;right:2px"><a onclick="document.getElementById(\'about\').style.display=\'none\';">Close</a></span>
	<div style="text-align:center;"><img src="omnomirc.png" alt="omnomirc"></div>
	<p>OmnomIRC is developed by <a href="http://www.omnimaga.org" alt="Omnimaga" target="_blank">Omnimaga</a></p>
	<h1>Programmers</h1>
	<ul><li><a href="http://netham45.org/" target="_blank">Netham45</a></li><li><a href="http://www.sorunome.de" target="_blank">Sorunome</a></li><li><a href="http://eeems.ca/" target="_blank">Eeems</a></li></ul>
	<h1>Style</h1>
	<ul><li><a href="http://www.omnimaga.org/index.php?action=profile;u=691" target="_blank">Darl181</a></li></ul>
	<a href="https://github.com/Sorunome/OmnomIRC2" target="_blank">GitHub</a>
</div></div>
<div id="smileyselect" style="display:none;">
</div>
<div id="lastSeenCont" style="display:none;"></div>
<audio id="ding" src="beep.wav" hidden></audio>
','main');

}
?>
