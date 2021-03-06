<?PHP
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
include_once(realpath(dirname(__FILE__)).'/omnomirc.php');

if(isset($_GET['offset'])){
	$offset = (int)$_GET['offset'];
}else{
	$offset = 0;
	$json->addWarning('Didn\'t set an offset, defaulting to zero.');
}
$channel = $you->chan;

if($you->isBanned()){
	$json->add('banned',true);
	$json->add('admin',false);
	$json->add('lines',Array());
	$json->add('users',Array());
	echo $json->get();
	die();
}
$json->add('banned',false);
$json->add('admin',$you->isGlobalOp());

if(isset($_GET['day'])){
	$t_low = (int)DateTime::createFromFormat('j-n-Y H:i:s',base64_url_decode($_GET['day']).' 00:00:00')->getTimestamp();
}else{
	$t_low = (int)time();
	$json->addWarning('No day set, defaulting to today');
}
$t_high = $t_low + (3600 * 24);
$lines = Array();
$table = 'irc_lines_old';
while(true){
	if($channel[0] == "*"){ // PM
		$res = $sql->query("SELECT * FROM `%s` 
								WHERE (
									((`channel` = '%s'
									AND `name1` = '%s')
									OR
									(`channel` = '%s'
									AND `name1` = '%s'))
								) AND
									`time` >= %d
										AND
									`time` <= %d
										AND
									`online` = %d
								ORDER BY `line_number` ASC 
								LIMIT %d,1000
							",$table,substr($channel,1),$you->nick,$you->nick,substr($channel,1),$t_low,$t_high,$you->getNetwork(),$offset);
	}else{
		$res = $sql->query("SELECT * FROM `%s` 
									WHERE (
											(`type` != 'server' AND ((`channel` = '%s' OR `channel` = '%s')
											)
											)
											OR (`type` = 'server' AND channel='%s' AND name2='%s')
										) AND
											`time` >= %d
										AND
											`time` <= %d
									ORDER BY `line_number` ASC 
									LIMIT %d,1000
										",$table,$channel,$you->nick,$you->nick,$channel,$t_low,$t_high,$offset);
	}
	
	foreach($res as $result){
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
	if(count($lines)<1000 && $table == 'irc_lines_old'){
		$table = 'irc_lines';
		continue;
	}
	break;
}

$json->add('lines',$lines);


echo $json->get();
?>
