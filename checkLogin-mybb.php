<?PHP
error_reporting(E_ALL);
ini_set('display_errors', '1');
$encriptKeyToUse = 'key from Config.php (created while installation)';
$checkCookie = '__cfduid';
function base64_url_encode($input){
	return strtr(base64_encode($input),'+/=','-_,');
}

function base64_url_decode($input){
	return base64_decode(strtr($input,'-_,','+/=')); 
}
define('IN_MYBB',1);
define('NO_ONLINE',1);
require_once "./global.php";

ob_start();
if(!isset($_GET['op'])){
	if(isset($_GET['txt'])){
		header('Content-type: text/plain');
	}elseif(!isset($_GET['textmode'])){
		header('Content-type: text/javascript');
	}
	if($mybb->user['username']=="" || $mybb->user['isbannedgroup'] || (isset($_GET['sid']) && htmlspecialchars(str_replace(";","%^%",$_COOKIE[$checkCookie]))!=$_GET['sid']) || !isset($_GET['sid'])){
		$nick = "Guest";
		$signature = "";
		$uid = 0;
	}else{
		$nick = $mybb->user['username'];
		$signature = base64_url_encode(mcrypt_encrypt ( MCRYPT_RIJNDAEL_256 , $encriptKeyToUse , $nick , MCRYPT_MODE_ECB));
		$uid = $mybb->user['uid'];
	}
}

ob_end_clean();
if(isset($_GET['op'])){
	header('Content-type: text/json');
	$id = $_GET['u'];
	$user = get_user((int) $id);
	$group = '';
	if(base64_url_decode($_GET['nick'])==$user['username'])
		$group = $user['usergroup'];
	header('Content-type: text/json');
	echo json_encode(array(
		'group' => $group
	));
}else{
	if(isset($_GET['txt'])){
		echo $signature."\n".$nick."\n".$uid;
	}elseif(isset($_GET['textmode'])){
		header('Location: http://chat.forum.acr.victorz.ca/textmode.php?login&nick='.urlencode($nick).'&sig='.urlencode($signature).'&id='.$uid);
	}else{
		header('Content-type: text/json');
		$json = json_encode(Array(
			'nick' => $nick,
			'signature' => $signature,
			'uid' => $uid
		));
		if(isset($_GET['jsoncallback'])){
			echo $_GET['jsoncallback'].'('.$json.')';
		}else{
			echo $json;
		}
	}
}
?>