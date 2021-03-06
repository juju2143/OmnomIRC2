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
class Json{
	private $json;
	private $warnings;
	private $errors;
	public function clear(){
		$this->warnings = Array();
		$this->errors = Array();
		$this->json = Array();
	}
	public function __construct(){
		$this->clear();
	}
	public function addWarning($s){
		$this->warnings[] = $s;
	}
	public function addError($s){
		$this->errors[] = $s;
	}
	public function add($key,$value){
		$this->json[$key] = $value;
	}
	public function get(){
		$this->json['warnings'] = $this->warnings;
		$this->json['errors'] = $this->errors;
		return json_encode($this->json);
	}
	public function hasErrors(){
		return sizeof($this->errors) > 0;
	}
	public function hasWarnings(){
		return sizeof($this->warnings) > 0;
	}
}
$json = new Json();

function errorHandler($errno,$errstr,$errfile,$errline){
	global $json;
	switch($errno){
		case E_USER_WARNING:
		case E_USER_NOTICE:
			$json->addWarning(Array('type' => 'php','number' => $errno,'message'=>$errstr,'file' => $errfile,'line' => $errline));
			break;
		//case E_USER_ERROR: // no need, already caught by default.
		default:
			$json->addError(Array('type' => 'php','number' => $errno,'message'=>$errstr,'file' => $errfile,'line' => $errline));
	}
}
if(!(isset($textmode) && $textmode===true)){
	set_error_handler('errorHandler',E_ALL);
	header('Content-Type: text/json');
}
header('Last-Modified: Thu, 01-Jan-1970 00:00:01 GMT');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0',false);
header('Pragma: no-cache');
date_default_timezone_set('UTC');
include_once(realpath(dirname(__FILE__)).'/config.php');
function base64_url_encode($input){
	return strtr(base64_encode($input),'+/=','-_,');
}
function base64_url_decode($input){
	return base64_decode(strtr($input,'-_,','+/=')); 
}
class Sqli{
	private $mysqliConnection;
	private function connectSql(){
		global $config,$json;
		if(isset($this->mysqliConnection)){
			return $this->mysqliConnection;
		}
		$mysqli = new mysqli($config['sql']['server'],$config['sql']['user'],$config['sql']['passwd'],$config['sql']['db']);
		if($mysqli->connect_errno){
			die('Could not connect to SQL DB: '.$mysqli->connect_errno.' '.$mysqli->connect_error);
		}
		if(!$mysqli->set_charset('utf8')){
			$json->addError(Array('type' => 'mysql','message' => 'Couldn\'t use utf8'));
		}
		$this->mysqliConnection = $mysqli;
		return $mysqli;
	}
	public function query(){
		//ini_set('memory_limit','-1');
		$mysqli = $this->connectSql();
		$params = func_get_args();
		$query = $params[0];
		$args = Array();
		for($i=1;$i<count($params);$i++)
			$args[$i-1] = $mysqli->real_escape_string($params[$i]);
		$result = $mysqli->query(vsprintf($query,$args));
		if($mysqli->errno==1065){ //empty
			return array();
		}
		if($mysqli->errno!=0){
			die($mysqli->error.' Query: '.vsprintf($query,$args));
		}
		if($result===true){ //nothing returned
			return Array();
		}
		$res = Array();
		$i = 0;
		while($row = $result->fetch_assoc()){
			$res[] = $row;
			if($i++>=1000)
				break;
		}
		if($res === Array()){
			$fields = $result->fetch_fields();
			for($i=0;$i<count($fields);$i++)
				$res[$fields[$i]->name] = NULL;
			$res = array($res);
		}
		$result->free();
		return $res;
	}
}
$sql = new Sqli();
class GlobalVars{
	public function set($s,$c,$t = NULL){ //set a global variable
		global $sql;
		$type = NULL;
		if($t===NULL){ //no third parameter, we detect the type
			switch(gettype($c)){
				case 'integer':
					$type = 1;
					break;
				case 'double':
					$type = 2;
					break;
				case 'boolean':
					$type = 4;
					break;
				case 'array':
					$c = json_encode($c);
					if(json_last_error()===0){
						$type = 5;
					}
					break;
				case 'object':
					$c = json_encode($c);
					if(json_last_error()===0){
						$type = 3;
					}
					break;
				case 'string':
				default:
					json_decode($c);
					if(json_last_error()){
						$type = 0;
					}else{
						$type = 3;
					}
			}
		}else{
			switch($t){ //user said which type he wants, we try to convert the variable
				case 'integer':
				case 'int':
					$c = (int)$c;
					$type = 1;
					break;
				case 'double':
				case 'float':
					$c = (float)$c;
					$type = 2;
					break;
				case 'boolean':
				case 'bool':
					$c = (bool)$c;
					$type = 4;
					break;
				case 'string':
				case 'str':
					$c = (string)$c;
					$type = 0;
					break;
				case 'json':
				case 'object':
					if(gettype($c)=='string'){
						json_decode($c);
						if(json_last_error()){
							return false;
						}
					}else{
						$c = json_encode($c);
						if(json_last_error()){
							return false;
						}
					}
					$type = 3;
					break;
				case 'array': //array is actually JSON, only with enabling the array option when parsing
					if(gettype($c)=='string'){
						json_decode($c);
						if(json_last_error()){
							return false;
						}
					}else{
						$c = json_encode($c);
						if(json_last_error()){
							return false;
						}
					}
					$type = 5;
					break;
			}
		}
		if($type===NULL){ //if we couldn't set a type return false
			return false;
		}
		$r = $sql->query("SELECT id,type FROM irc_vars WHERE name='%s'",$s);
		$r = $r[0];
		if(isset($r['id'])){ //check if we need to update or add a new
			$sql->query("UPDATE irc_vars SET value='%s',type='%s' WHERE name='%s'",$c,$type,$s);
		}else{
			$sql->query("INSERT INTO irc_vars (name,value,type) VALUES('%s','%s',%d)",$s,$c,(int)$type);
		}
		return true;
	}
	public function get($s){
		global $sql;
		$res = $sql->query("SELECT value,type FROM irc_vars WHERE name='%s'",$s);
		$res = $res[0];
		switch((int)$res['type']){ //convert to types, else return false
			case 0:
				return (string)$res['value'];
			case 1:
				return (int)$res['value'];
			case 2:
				return (float)$res['value'];
			case 3:
				$json = json_decode($res['value']);
				if(json_last_error()){
					return false;
				}
				return $json;
			case 4:
				return (bool)$res['value'];
			case 5:
				$json = json_decode($res['value'],true);
				if(json_last_error()){
					return false;
				}
				return $json;
		}
		return false;
	}
}
$vars = new GlobalVars();
class Secure{
	public function sign($s,$n){
		global $config;
		return hash('sha512',$n.$config['security']['sigKey'].$s);
	}
}
$security = new Secure();
class Networks{
	private $nets;
	public function __construct(){
		global $config;
		$this->nets = Array();
		foreach($config['networks'] as $n){
			$this->nets[$n['id']] = $n;
		}
	}
	public function get($i){
		if(isset($this->nets[$i])){
			return $this->nets[$i];
		}
		return NULL;
	}
	public function getNetsArray(){
		return $this->nets;
	}
}
$networks = new Networks();
class Users{
	public function notifyJoin($nick,$channel){
		global $sql;
		if($nick){
			$sql->query("INSERT INTO `irc_lines` (name1,type,channel,time,online) VALUES('%s','join','%s','%s',1)",$nick,$channel,time());
		}
	}
	public function notifyPart($nick,$channel){
		global $sql;
		if($nick){
			$sql->query("INSERT INTO `irc_lines` (name1,type,channel,time,online) VALUES('%s','part','%s','%s',1)",$nick,$channel,time());
		}
	}
	public function clean(){
		global $sql;
		$result = $sql->query("SELECT `username`,`channel` FROM `irc_users` WHERE `time` < %s  AND `online`='1' AND `isOnline`='1'",strtotime('-1 minute'));
		$sql->query("UPDATE `irc_users` SET `isOnline`='0' WHERE `time` < %s  AND `online`='1' AND `isOnline`='1'",strtotime('-1 minute'));
		foreach($result as $row){
			$this->notifyPart($row['username'],$row['channel']);
		}
	}
}
$users = new Users();
class You{
	public $nick;
	private $sig;
	private $id;
	private $loggedIn;
	private $globalOps;
	private $ops;
	private $infoStuff;
	private $network;
	private $chanName;
	public $chan;
	public function __construct($n = false){
		global $security,$json,$ADMINPAGE,$config,$networks;
		if($n!==false){
			$this->nick = $n;
		}elseif(isset($_GET['nick'])){
			$this->nick = base64_url_decode($_GET['nick']);
		}else{
			$json->addError('Nick not set');
			$this->nick = '';
		}
		if(isset($_GET['signature'])){
			$this->sig = base64_url_decode($_GET['signature']);
		}else{
			$json->addError('Signature not set');
			$this->sig = '';
		}
		if(isset($_GET['id'])){
			$this->id = (int)$_GET['id'];
		}else{
			$json->addWarning('ID not set, some features may be unavailable');
			$this->id = 0;
		}
		if(isset($_GET['network'])){
			if(($this->network = $networks->get((int)$_GET['network'])) != NULL){
				if($this->network['type'] == 1){
					$this->network = $this->network['id'];
				}else{
					$this->network = $config['settings']['defaultNetwork'];
				}
			}else{
				$this->network = $config['settings']['defaultNetwork'];
			}
		}else{
			$this->network = $config['settings']['defaultNetwork'];
		}
		if(isset($_GET['channel'])){
			if(preg_match('/^[0-9]+$/',$_GET['channel'])){
				$this->setChan($_GET['channel']);
			}else{
				$this->setChan(base64_url_decode($_GET['channel']));
			}
		}else{
			if($ADMINPAGE!==true){
				$order = -1;
				$defaultChan = '';
				foreach($config['channels'] as $chan){
					if($chan['enabled']){
						foreach($chan['networks'] as $cn){
							if($cn['id'] == $this->network && ($order == -1 || $cn['order']<$order)){
								$order = $cn['order'];
								$defaultChan = $chan['id'];
							}
						}
					}
				}
				$json->addWarning('Didn\'t set a channel, defaulting to '.$defaultChan);
			}else{
				$defaultChan = 'false';
			}
			$this->chan = $defaultChan;
		}
		$this->globalOps = NULL;
		$this->ops = NULL;
		$this->infoStuff = NULL;
		$this->loggedIn = ($this->sig == $security->sign($this->nick,$this->network) && $this->nick!=='');
		if(!$this->loggedIn){
			$json->addWarning('Not logged in');
		}
	}
	public function setChan($channel){
		global $json,$config;
		if($channel == ''){
			$json->addError('Invalid channel');
			echo $json->get();
			die();
		}
		if(!preg_match('/^[0-9]+$/',$channel) && $channel[0]!="*" && $channel[0]!="#" && $channel[0]!="@" && $channel[0]!="&"){
			$json->addError('Invalid channel');
			echo $json->get();
			die();
		}
		$this->chanName = $channel;
		if($channel[0]=='#' || $channel[0]=='&' || preg_match('/^[0-9]+$/',$channel)){
			$foundChan = false;
			foreach($config['channels'] as $chan){
				if($chan['enabled']){
					foreach($chan['networks'] as $cn){
						if($cn['id'] == $this->network && (strtolower($cn['name'])==strtolower($channel) || $chan['id']==$channel)){
							$channel = $chan['id'];
							$this->chanName = $cn['name'];
							$foundChan = true;
							break;
						}
					}
				}
				if($foundChan){
					break;
				}
			}
			if(!$foundChan){
				$json->addError('Invalid channel');
				echo $json->get();
				die();
			}
		}
		$this->chan = $channel;
	}
	public function channelName(){
		return $this->chanName;
	}
	public function getUrlParams(){
		return 'nick='.base64_url_encode($this->nick).'&signature='.base64_url_encode($this->sig).'&id='.($this->id).'&channel='.(preg_match('/^[0-9]+$/',$this->chan)?$this->chan:base64_url_encode($this->chan)).'&network='.$this->getNetwork();
	}
	public function update(){
		global $sql,$users;
		if($this->chan[0]=='*' || $this->chan=='0'){
			return;
		}
		$result = $sql->query("SELECT usernum,time,isOnline FROM `irc_users` WHERE `username` = '%s' AND `channel` = '%s' AND `online` = 1",$this->nick,$this->chan);
		if($result[0]['usernum']!==NULL){ //Update  
			$sql->query("UPDATE `irc_users` SET `time`='%s',`isOnline`='1' WHERE `usernum` = %d",time(),(int)$result[0]['usernum']);
			if((int)$result[0]['isOnline'] == 0){
				$users->notifyJoin($this->nick,$this->chan);
			}
		}else{
			$sql->query("INSERT INTO `irc_users` (`username`,`channel`,`time`,`online`) VALUES('%s','%s','%s',1)",$this->nick,$this->chan,time());
			$users->notifyJoin($this->nick,$this->chan);
		}
		$users->clean();
	}
	public function info(){
		global $sql;
		if($this->infoStuff !== NULL){
			return $this->infoStuff;
		}
		$temp = $sql->query("SELECT * FROM `irc_userstuff` WHERE name='%s'",strtolower($this->nick));
		$userSql = $temp[0];
		if($userSql['name']===NULL){
			$sql->query("INSERT INTO `irc_userstuff` (name) VALUES('%s')",strtolower($this->nick));
			$temp = $sql->query("SELECT * FROM `irc_userstuff` WHERE name='%s'",strtolower($this->nick));
			$userSql = $temp[0];
		}
		$this->infoStuff = $userSql;
		return $userSql;
	}
	public function isGlobalOp(){
		global $config,$networks;
		if(!$config['info']['installed']){
			return true;
		}
		if($this->globalOps !== NULL){
			return $this->globalOps;
		}
		if(!$this->loggedIn){
			$this->globalOps = false;
			return false;
		}
		$userSql = $this->info();
		if($userSql['globalOp']==1){
			$this->globalOps = true;
			return true;
		}
		$cl = $networks->get($this->getNetwork());
		$cl = $cl['config']['checkLogin'];
		$returnPosition = json_decode(trim(file_get_contents($cl.'?op&u='.$this->id.'&nick='.base64_url_encode($this->nick))));
		if(in_array($returnPosition->group,$config['opGroups'])){
			$this->globalOps = true;
			return true;
		}
		$this->globalOps = false;
		return false;
	}
	public function isOp(){
		global $config;
		if($this->ops !== NULL){
			return $this->ops;
		}
		if($this->isGlobalOp()){
			$this->ops = true;
			return true;
		}
		$userSql = $this->info($nick);
		if(strpos($userSql['ops'],$this->chan."\n")!==false){
			$this->ops = true;
			return true;
		}
		$this->ops = false;
		return false;
	}
	public function isBanned(){
		$userSql = $this->info();
		if(strpos($userSql['bans'],$this->chan."\n")!==false || $userSql['globalBan']=='1'){
			return true;
		}
		return false;
	}
	public function getNetwork(){
		return $this->network;
	}
}
$you = new You();
class OmnomIRC{
	public function getLines($res,$table = 'irc_lines',$overrideIgnores = false){
		global $you;
		$userSql = $you->info();
		if($userSql['name']!=NULL){
			$ignorelist = $userSql['ignores'];
		}
		$lines = Array();
		foreach($res as $result){
			if((strpos($userSql['ignores'],strtolower($result['name1'])."\n")===false) || $overrideIgnores){
				$lines[] = Array(
					'curLine' => ($table=='irc_lines'?(int)$result['line_number']:0),
					'type' => $result['type'],
					'network' => (int)$result['Online'],
					'time' => (int)$result['time'],
					'name' => $result['name1'],
					'message' => $result['message'],
					'name2' => $result['name2'],
					'chan' => $result['channel']
				);
			}
		}
		return $lines;
	}
	public function loadChannel($count){
		global $you,$sql;
		$table = 'irc_lines';
		$linesExtra = Array();
		
		while(true){
			if($you->chan[0] == '*'){ // PM
				$res = $sql->query("
					SELECT x.* FROM (
						SELECT * FROM `%s` 
						WHERE
						(
							(
								LOWER(`channel`) = LOWER('%s')
								AND
								LOWER(`name1`) = LOWER('%s')
							)
							OR
							(
								LOWER(`channel`) = LOWER('%s')
								AND
								LOWER(`name1`) = LOWER('%s')
							)
						)
						AND `online` = %d
						ORDER BY `line_number` DESC
						LIMIT %d
					) AS x
					ORDER BY `line_number` ASC
					",$table,substr($you->chan,1),$you->nick,$you->nick,substr($you->chan,1),$you->getNetwork(),(int)$count);
			}else{
				$res = $sql->query("
					SELECT x.* FROM (
						SELECT * FROM `%s`
						WHERE
						(
							`type` != 'server'
							AND
							`type` != 'pm'
							AND
							(
								(
									LOWER(`channel`) = LOWER('%s')
									OR
									LOWER(`channel`) = LOWER('%s')
								)
							)
							AND NOT
							(
								(`type` = 'join' OR `type` = 'part') AND `Online` = 1
							)
						)
						OR
						(
							`type` = 'server'
							AND
							LOWER(`channel`)=LOWER('%s')
							AND
							LOWER(`name2`)=LOWER('%s')
						)
						ORDER BY `line_number` DESC
						LIMIT %d
					) AS x
					ORDER BY `line_number` ASC
					",$table,$you->chan,$you->nick,$you->nick,$you->chan,(int)$count);
			}
			
			$lines = $this->getLines($res,$table);
			
			if(count($lines)<$count && $table=='irc_lines'){
				$count -= count($lines);
				$table = 'irc_lines_old';
				$linesExtra = $lines;
				continue;
			}
			break;
		}
		return array_merge($lines,$linesExtra);
	}
}
$omnomirc = new OmnomIRC();
?>