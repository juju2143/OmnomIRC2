<?php
/* This is a automatically generated config-file by OmnomIRC, please use the admin pannel to edit it! */
include_once(realpath(dirname(__FILE__)).'/Source/sql.php');
include_once(realpath(dirname(__FILE__)).'/Source/sign.php');
include_once(realpath(dirname(__FILE__)).'/Source/userlist.php');
include_once(realpath(dirname(__FILE__)).'/Source/cachefix.php');

function getConfig(){
	$cfg = explode("\n",file_get_contents(realpath(dirname(__FILE__)).'/config.php'));
	$searchingJson = true;
	$json = '';
	foreach($cfg as $line){
		if($searchingJson){
			if(trim($line)=='JSONSTART'){
				$searchingJson = false;
			}
		}else{
			if(trim($line)=='JSONEND'){
				break;
			}
			$json .= $line;
		}
	}
	return json_decode($json,true);
}
$config = getConfig();
/*
JSONSTART
{"info":{"version":"2.7.0","installed":true},"sql":{"server":"localhost","db":"omnomirc","user":"omnomirc","passwd":""},"security":{"sigKey":"","calcKey":"","cookie":"PHPSESSID"},"settings":{"hostname":"omnomirc","checkLoginUrl":"http:\/\/omnomirc\/checkLogin-smf.php","curidFilePath":"\/usr\/share\/nginx\/html\/oirc\/omnomirc_curid","externalStyleSheet":""},"channels":[{"chan":"#omnomirc","visible":true}],"exChans":[],"opGroups":["true"],"hotlinks":[{"inner":"Full View","href":".","target":"_top"},{"inner":"Toggle","href":"#","id":"toggleButton"},{"inner":"Options","href":"?options"},{"inner":"About","onclick":"if(document.getElementById('about').style.display=='none'){document.getElementById('about').style.display='';}else{document.getElementById('about').style.display='none';};return false"},{"inner":"Help","target":"_blank","href":"http:\/\/ourl.ca\/17329"}],"networks":[{"normal":"<b>NICK<\/b>","userlist":"!NICK","name":"Server"},{"normal":"<a target=\"_top\" href=\"#NICKENCODE\">NICK<\/a>","userlist":"<a target=\"_top\" href=\"NICKENCODE\"><img src=\"omni.png\">NICK<\/a>","name":"OmnomIRC"},{"normal":"<span style=\"color:#8A5D22\">(C)<\/span> NICK","userlist":"<span style=\"color:#8A5D22\">(C)<\/span> NICK","name":"Calcnet"},{"normal":"NICK","userlist":"#NICK","name":"IRC"}],"irc":{"main":{"servers":[{"server":"irc server","port":6667,"nickserv":"nickserv password","network":3}],"nick":"OmnomIRC"},"topic":{"servers":[{"server":"irc server","port":6667,"nickserv":"nickserv password","network":3}],"nick":"TopicBot"},"password":""},"smileys":[{"pic":"smileys\/rolleyes.gif","alt":"Roll Eyes","code":"::)","inMenu":true,"regex":"(^| )(::\\)|::-\\))","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/smiley.gif","alt":"smiley","code":":)","inMenu":true,"regex":"(^| )(:\\)|:-\\))","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/wink.gif","alt":"Wink","code":";)","inMenu":true,"regex":"(^| )(;\\)|;-\\))","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/evil.gif","alt":"Evil","code":">:D","inMenu":true,"regex":"(^| )(&gt;:D|&gt;:-D)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/cheesy.gif","alt":"Cheesy","code":":D","inMenu":true,"regex":"(^| )(:D|:-D)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/grin.gif","alt":"Grin","code":";D","inMenu":true,"regex":"(^| )(;D|;-D)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/angry.gif","alt":"Angry","code":">:(","inMenu":true,"regex":"(^| )(&gt;:\\(|&gt;:-\\()","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/sad.gif","alt":"Sad","code":":(","inMenu":true,"regex":"(^| )(:\\(|:-\\()","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/shocked.gif","alt":"Shocked","code":":o","inMenu":true,"regex":"(^| )(:o|:O|:-o|:-O)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/cool.gif","alt":"Cool","code":"8)","inMenu":true,"regex":"(^| )(8\\))","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/huh.gif","alt":"Huh","code":"???","inMenu":true,"regex":"(^| )\\?\\?\\?","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/tongue.gif","alt":"Tongue","code":":P","inMenu":true,"regex":"(^| )(:P|:-P|:p|:-p)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/embarrassed.gif","alt":"Embarrassed","code":":[","inMenu":true,"regex":"(^| )(:\\[|:-\\[)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/lipsrsealed.gif","alt":"Lips Sealed","code":":x","inMenu":true,"regex":"(^| )(:x|:X|:-x|:-X)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/undecided.gif","alt":"Undecided","code":":\/","inMenu":true,"regex":"(^| )(:\\\\|:-\\\\|:\/|:-\/)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/kiss.gif","alt":"Kiss","code":":-*","inMenu":true,"regex":"(^| ):-\\*","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/cry.gif","alt":"Cry","code":":'(","inMenu":true,"regex":"(^| )(:'\\(|:'-\\()","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/thumbsupsmiley.gif","alt":"Thumbs Up","code":":thumbsup:","inMenu":true,"regex":":thumbsup:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/shocked2.gif","alt":"Shocked","code":"O.O","inMenu":true,"regex":"(^| )O\\.O","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/azn.gif","alt":"Azn","code":"^-^","inMenu":true,"regex":"(^| )\\^-\\^","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/alien2.gif","alt":"Alien","code":">B)","inMenu":true,"regex":"(^| )&gt;B\\)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/banghead.gif","alt":"Banghead","code":":banghead:","inMenu":true,"regex":"(:banghead:|:headbang:)","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/ange.gif","alt":"Angel","code":":angel:","inMenu":true,"regex":":angel:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/meh.gif","alt":"Meh","code":"._.","inMenu":true,"regex":"(^| )\\._\\.","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/blah.gif","alt":"Blah","code":":blah:","inMenu":true,"regex":":blah:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/kittyface.gif","alt":"Kittyface","code":":3","inMenu":true,"regex":"(^| ):3","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/devil.gif","alt":"Devil","code":":devil:","inMenu":true,"regex":":devil:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/dry.gif","alt":"Dry","code":"<_<","inMenu":true,"regex":"(^| )&lt;_&lt;","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/evillaugh.gif","alt":"Evil Laugh","code":":evillaugh:","inMenu":true,"regex":":evillaugh:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/fou.gif","alt":"Crazy","code":":crazy:","inMenu":true,"regex":":crazy:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/happy0075.gif","alt":"Hyper","code":":hyper:","inMenu":true,"regex":":hyper:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/love.gif","alt":"Love","code":":love:","inMenu":true,"regex":":love:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/mad.gif","alt":"Mad","code":":mad:","inMenu":true,"regex":":mad:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/smiley_woot.gif","alt":"w00t","code":":w00t:","inMenu":true,"regex":":w00t:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/psychedelicO_O.gif","alt":"O.O.O","code":"*.*","inMenu":true,"regex":"(^| )\\*\\.\\*","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/bigfrown.gif","alt":"Big Frown","code":"D:","inMenu":true,"regex":"(^| )D:","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/XD.gif","alt":"XD","code":"XD","inMenu":true,"regex":"(^| )(XD|xD)","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/X_X.gif","alt":"x.x","code":"x.x","inMenu":true,"regex":"(^| )x\\.x","replace":"$1<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"},{"pic":"smileys\/ninja.gif","alt":"Ninja","code":":ninja:","inMenu":true,"regex":":ninja:","replace":"<img src=\"PIC\" alt=\"ALT\" title=\"ALT\" ADDSTUFF>"}]}
JSONEND
*/
$defaultChan = $config['channels'][0]['chan'];
if(isset($_GET['js'])){
	header('Content-type: text/json');
	$channels = [];
	foreach($config["channels"] as $chan){
		$channels[] = [
			"chan" => $chan["chan"],
			"high" => false,
			"ex" => !$chan["visible"]
		];
	}
	echo json_encode([
		"hostname" => $config['settings']['hostname'],
		"channels" => $channels,
		"smileys" => $config["smileys"],
		"networks" => $config["networks"],
		"checkLoginUrl" => (isset($_COOKIE[$config["security"]["cookie"]])?$config["settings"]["checkLoginUrl"]."?sid=".urlencode(htmlspecialchars(str_replace(";","%^%",$_COOKIE[$config["security"]["cookie"]]))):$config["settings"]["checkLoginUrl"]."?sid=THEGAME")
	]);
}
?>