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
(function($){
	var settings = (function(){
			var hostname = '',
				nick = '',
				signature = '',
				numHigh = 4,
				uid = 0,
				checkLoginUrl = '',
				net = '',
				networks = [];
			return {
				fetch:function(fn){
					network.getJSON('config.php?js'+(document.URL.split('network=')[1]!==undefined?'&network='+document.URL.split('network=')[1].split('&')[0]:''),function(data){
						hostname = data.hostname;
						channels.setChans(data.channels);
						parser.setSmileys(data.smileys);
						networks = data.networks;
						checkLoginUrl = data.checkLoginUrl;
						net = data.network;
						options.setDefaults(data.defaults);
						network.getJSON(checkLoginUrl+'&network='+net.toString()+'&jsoncallback=?',function(data){
							nick = data.nick;
							signature = data.signature;
							uid = data.uid;
							if(fn!==undefined){
								fn();
							}
						});
					});
				},
				getUrlParams:function(){
					return 'nick='+base64.encode(nick)+'&signature='+base64.encode(signature)+'&time='+(+new Date()).toString()+'&id='+uid+'&network='+net;
				},
				networks:function(){
					return networks;
				},
				nick:function(){
					return nick;
				},
				net:function(){
					return net;
				}
			};
		})(),
		ls = (function(){
			var getCookie = function(c_name){
					var i,x,y,ARRcookies=document.cookie.split(";");
					for(i=0;i<ARRcookies.length;i++){
						x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
						y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
						x=x.replace(/^\s+|\s+$/g,"");
						if(x==c_name){
							return unescape(y);
						}
					}
				},
				setCookie = function(c_name,value,exdays){
					var exdate = new Date(),
						c_value = escape(value);
					exdate.setDate(exdate.getDate() + exdays);
					c_value += ((exdays===null) ? '' : '; expires='+exdate.toUTCString());
					document.cookie=c_name + '=' + c_value;
				},
				support = function(){
					try{
						return 'localStorage' in window && window['localStorage'] !== null;
					}catch(e){
						return false;
					}
				};
			return {
				get:function(name){
					if(support()){
						return localStorage.getItem(name);
					}
					return getCookie(name);
				},
				set:function(name,value){
					if(support()){
						localStorage.setItem(name,value);
					}else{
						setCookie(name,value,30);
					}
				}
			};
		})(),
		network = (function(){
			var errors = [],
				warnings = [],
				removeSig = function(s){
					try{
						var parts = s.split('signature='),
							moreParts = parts[1].split('&');
						moreParts[0] = '---';
						parts[1] = moreParts.join('&');
						return parts.join('signature=');
					}catch(e){
						if(s.indexOf('signature')!==-1){
							return 'omited due to security reasons';
						}
						return s;
					}
				},
				addError = function(s,e){
					s = removeSig(s);
					errors.push({
						time:(new Date().getTime()),
						file:s,
						content:e
					});
					$('#errors')
						.css('display','')
						.find('.count')
						.text(errors.length);
				},
				addWarning = function(s,e){
					s = removeSig(s);
					warnings.push({
						time:(new Date().getTime()),
						file:s,
						content:e
					});
					$('#warnings')
						.css('display','')
						.find('.count')
						.text(warnings.length);
				};
			return {
				getJSON:function(s,fn){
					return $.getJSON(s)
						.done(function(data){
							if(data.errors!==undefined){
								$.each(data.errors,function(i,e){
									if(e.type!==undefined){
										addError(s,e);
									}else{
										addError(s,{
											type:'misc',
											message:e
										});
									}
								});
							}
							if(data.warnings!==undefined){
								$.each(data.warnings,function(i,w){
									if(w.type!==undefined){
										addWarning(s,w);
									}else{
										addWarning(s,{
											type:'misc',
											message:w
										});
									}
								});
							}
							fn(data);
						});
				},
				init:function(){
					var makePopup = function(type,data){
						return $('<div>')
								.addClass('errorPopup')
								.append(
									$('<a>')
										.text('Close')
										.click(function(e){
											e.preventDefault();
											$(this).parent().remove();
										}),
									'&nbsp;',
									$('<b>')
										.text(type),
									$('<div>')
										.append(
											$.map(data,function(e){
												return $('<div>')
													.css('border-bottom','1px solid black')
													.append(
														'Time: ',
														(new Date(e.time)).toLocaleTimeString(),
														'<br>File: ',
														$('<span>').text(e.file).html(),
														$.map(e.content,function(val,i){
															return ['<br>',$('<span>').text(i).html(),': ',$('<span>').text(val).html()];
														})
													);
											})
										)
								)
								.appendTo('body');
					};
					$('#errors > .icon')
						.click(function(){
							makePopup('Errors',errors);
						});
					$('#warnings > .icon')
						.click(function(){
							makePopup('Warnings',warnings);
						});
				}
			};
		})(),
		admin = (function(){
			var sendEdit = function(page,json){
					$.post('admin.php?set='+page+'&'+settings.getUrlParams(),{data:JSON.stringify(json)},function(data){
						var alertStr = '';
						if(data.errors!==undefined){
							$.map(data.errors,function(error){
								alertStr += 'ERROR: '+error+"\n";
							});
						}else{
							alertStr = data.message;
						}
						alert(alertStr);
					});
				},
				getInputBoxSettings = function(p,name,data){
					$('#adminContent').append(
						'<div style="font-weight:bold">'+name+' Settings</div>',
						$.map(data,function(d,i){
							if(i!=='warnings' && i!=='errors'){
								return $('<div>')
									.append(
										i,
										': ',
										$('<input>')
											.attr({
												type:'text',
												name:i
											})
											.val(d)
									);
							}
						}),
						$('<button>')
							.text('submit')
							.click(function(){
								var json = {};
								$('input').each(function(i,v){
									json[$(v).attr('name')] = $(v).val();
								});
								sendEdit(p,json);
							})
					);
				},
				getJSONEditSettings = function(p,name,data){
					var json = data;
					$('#adminContent').append(
						'<div style="font-weight:bold">'+name+' Settings</div>',
						$('<div>').addClass('json-editor').jsonEditor(json,{
							change:function(data){
								json = data;
							}
						}),
						$('<button>')
							.text('submit')
							.click(function(){
								sendEdit(p,json);
							})
					);
				},
				makeNetworksPage = function(nets){
					$('#adminContent').append(
						$('<div>').append(
								$.map(nets,function(net,i){
									var $netSpecific = $('<b>').text('Unkown network type');
									switch(net.type){
										case 0:
											$netSpecific.text('Server Network');
											break;
										case 1:
											$netSpecific = $('<span>').append(
													$('<b>').text('OmnomIRC network'),
													'<br>checkLogin:',
													$('<input>').attr('type','text').val(net.config.checkLogin).css('width',160).change(function(){nets[i].config.checkLogin = $(this).val();}),
													'<br>externalStyleSheet:',
													$('<input>').attr('type','text').val(net.config.externalStyleSheet).css('width',120).change(function(){nets[i].config.externalStyleSheet = $(this).val();}),
													'<br>',
													$('<button>').text('Use Current settings as defaults').click(function(){
															nets[i].config.defaults = options.getFullOptionsString();
														})
												);
											break;
										case 2:
											$netSpecific = $('<span>').append(
													$('<b>').text('CalcNet network'),
													'<br>Server:',
													$('<input>').attr('type','text').val(net.config.server).change(function(){nets[i].config.server = $(this).val();}),
													'<br>Port:',
													$('<input>').attr('type','number').val(net.config.port).change(function(){nets[i].config.port = parseInt($(this).val(),10);})
												);
											break;
										case 3:
											$netSpecific = $('<span>').append(
													$('<b>').text('IRC network'),
													'<br>',
													$.map(['main','topic'],function(v){
														return $('<span>').append(
																v,
																':<br>Nick:',
																$('<input>').attr('type','text').val(net.config[v].nick).change(function(){nets[i].config[v].nick = $(this).val();}),
																'<br>Server:',
																$('<input>').attr('type','text').val(net.config[v].server).change(function(){nets[i].config[v].server = $(this).val();}),
																'<br>Port',
																$('<input>').attr('type','number').val(net.config[v].port).change(function(){nets[i].config[v].port = parseInt($(this).val(),10)}),
																'<br>NickServ:',
																$('<input>').attr('type','text').val(net.config[v].nickserv).change(function(){nets[i].config[v].nickserv = $(this).val();})
															);
													})
												);
											break;
									}
									return $('<div>').css({
											'display':'inline-block',
											'border':'1px solid black',
											'vertical-align':'top'
										})
										.append(
												$('<span>').css('font-weight','bold').text(net.name),
												'<br>Enabled:',
												$('<input>').attr('type','checkbox').attr((net.enabled?'checked':'false'),'checked').change(function(){nets[i].enabled = this.checked;}),
												'<br>Normal:',
												$('<input>').attr('type','text').val(net.normal).change(function(){nets[i].normal = $(this).val();}),
												'<br>Userlist:',
												$('<input>').attr('type','text').val(net.userlist).change(function(){nets[i].userlist = $(this).val();}),
												'<br>IRC:',
												$('<input>').attr('type','number').val(net.irc.color).css('width',50).change(function(){nets[i].irc.color = parseInt($(this).val(),10);}),
												$('<input>').attr('type','text').val(net.irc.prefix).css('width',50).change(function(){nets[i].irc.prefix = $(this).val();}),
												'<br>',
												$netSpecific
											);
								}),
								$('<select>').append(
										$('<option>').val(-1).text('Add Network...'),
										$('<option>').val(1).text('OmnomIRC'),
										$('<option>').val(2).text('CalcNet'),
										$('<option>').val(3).text('IRC')
									)
									.change(function(){
										var name = prompt('New Network Name'),
											newNet = null,
											specificConfig,
											maxId;
										if(name!=='' && name!==null){
											switch(parseInt($(this).val(),10)){
												case 1: // omnomirc
													specificConfig = {
														'checkLogin':'link to checkLogin file',
														'externalStyleSheet':'',
														'defaults':''
													};
													break;
												case 2:
													specificConfig = {
														'server':'mydomain.com',
														'port':4295
													}
													break;
												case 3:
													specificConfig = {
														'main':{
															'nick':'OmnomIRC',
															'server':'irc server',
															'port':6667,
															'nickserv':'nickserv password'
														},
														'topic':{
															'nick':'',
															'server':'irc server',
															'port':6667,
															'nickserv':'nickserv password'
														}
													}
													break;
												default:
													specificConfig = null;
											}
											if(specificConfig !== null){
												maxId = 0;
												$.each(nets,function(i,v){
													if(v.id > maxId){
														maxId = v.id;
													}
												});
												newNet = {
													'enabled':true,
													'id':maxId+1,
													'type':parseInt($(this).val(),10),
													'normal':'NICK',
													'userlist':'('+name[0].toUpperCase()+')NICK',
													'irc':{
														'color':-1,
														'prefix':'('+name[0].toUpperCase()+')'
													},
													'name':name,
													'config':specificConfig
												}
												nets.push(newNet);
												$('#adminContent').empty();
												makeNetworksPage(nets);
											}
										}else{
											$(this).val(-1);
										}
									})
							),
						$('<button>')
							.text('submit')
							.click(function(){
								sendEdit('networks',nets);
							})
					);
				},
				makeChannelsPage = function(chans,nets){
					var makeAdvancedChanEditingForm = function(chan,i,elem){
							$(elem).empty().append(
								$.map(chan.networks,function(net,ni){
									return [$('<div>').css({
											'display':'inline-block',
											'border':'1px solid black',
											'margin':5
										})
										.append(
											$('<b>').text(nets[net.id].name),
											' ',
											$('<a>').text('remove').click(function(e){
												e.preventDefault();
												chans[i].networks.splice(ni,1);
												chan = chans[i];
												makeAdvancedChanEditingForm(chan,i,$(this).parent().parent());
											}),
											'<br>Name:',
											$('<input>').attr('type','text').val(net.name).change(function(){chans[i].networks[ni].name = $(this).val();}),
											(nets[net.id].type==1?[
												'<br>Hidden:',
												$('<input>').attr('type','checkbox').attr((net.hidden?'checked':'false'),'checked').change(function(){chans[i].networks[ni].hidden = this.checked;}),
												'<br>Order:',
												$('<input>').attr('type','number').val(net.order).change(function(){chans[i].networks[ni].order = parseInt($(this).val(),10);})
											]:'')
										),
										'<br>'
										];
								}),
								$('<select>').append(
										$('<option>').text('Add to network...').val(-1),
										$.map(nets,function(n){
											return $('<option>').text(n.name).val(n.id);
										})
									)
									.change(function(){
										var netId = parseInt($(this).val(),10),
											maxOrder = 0;
										$.each(chans,function(chani,ch){
											$.each(ch.networks,function(neti,nt){
												if(nt.id==netId &&  nt.order>maxOrder && maxOrder!=-1){
													maxOrder = nt.order;
												}
												if(nt.id==netId && chani==i){
													maxOrder = -1;
												}
											})
										});
										if(maxOrder==-1){
											alert('Network already exists!');
											$(this).val(-1);
											return;
										}
										chans[i].networks.push({
											'id':netId,
											'name':'',
											'hidden':false,
											'order':maxOrder+1
										})
										chan = chans[i];
										makeAdvancedChanEditingForm(chan,i,$(this).parent());
									})
							);
						};
					$('#adminContent').append(
							$('<div>').append(
									$.map(chans,function(chan,i){
										return $('<div>').css({
												'display':'inline-block',
												'border':'1px solid black',
												'vertical-align':'top'
											})
											.append(
												$('<b>').text(chan.alias),
												'<br>Enabled:',
												$('<input>').attr('type','checkbox').attr((chan.enabled?'checked':'false'),'checked').change(function(){chans[i].enabled = this.checked;}),
												'<br>',
												$('<div>').css({
														'display':'inline-block',
														'border':'1px solid black'
													})
													.append(
														$('<input>').attr('type','text').val(chan.networks[0].name).change(function(){
																var _this = this;
																$.each(chan.networks,function(netI){
																	chans[i].networks[netI].name = $(_this).val();
																});
															}),
														'<br>',
														$('<a>').text('Show advanced settings').click(function(e){
															e.preventDefault();
															makeAdvancedChanEditingForm(chan,i,$(this).parent());
														})
													)
											)
									}),
									$('<button>').text('New Channel').click(function(e){
											e.preventDefault();
											var alias = prompt('New Channel alias'),
												netsToAdd = [],
												maxId = 0;
											if(alias!=='' && alias!==null){
												netsToAdd = $.map(nets,function(n){
														var maxOrder = 0;
														if(n.type==1){
															$.each(chans,function(chani,ch){
																$.each(ch.networks,function(neti,nt){
																	if(nt.id==n.id &&  nt.order>maxOrder && maxOrder!=-1){
																		maxOrder = nt.order;
																	}
																});
															});
														}
														if(n.type==0){
															return undefined;
														}
														return {
																'id':n.id,
																'name':'',
																'hidden':false,
																'order':maxOrder+1
															};
													});
												$.each(chans,function(chani,c){
													if(c.id>maxId){
														maxId = c.id;
													}
												});
												chans.push({
														'id':maxId+1,
														'alias':alias,
														'enabled':true,
														'networks':netsToAdd
													});
												$('#adminContent').empty();
												makeChannelsPage(chans,nets);
											}
										})
								),
						$('<button>')
							.text('submit')
							.click(function(){
								sendEdit('channels',chans);
							})
						);
				},
				loadPage = function(p){
					indicator.start();
					$('#adminContent').text('Loading...');
					network.getJSON('admin.php?get='+encodeURIComponent(p)+'&'+settings.getUrlParams(),function(data){
						$('#adminContent').empty();
						switch(p){
							case 'index':
								$('#adminContent').append(
									'OmnomIRC Version: '+data.version+'<br>',
									$('<span>').text('checking for updates...'),
									'<br>',
									$('<button>')
										.text('Back up config')
										.click(function(){
											sendEdit('backupConfig',{});
										})
								);
								break;
							case 'channels':
								makeChannelsPage(data.channels,data.nets);
								break;
							case 'hotlinks':
								getJSONEditSettings(p,'Hotlink',data.hotlinks);
								break;
							case 'smileys':
								getJSONEditSettings(p,'Smiley',data.smileys);
								break;
							case 'networks':
								makeNetworksPage(data.networks);
								break;
							case 'sql':
								$.extend(data,{
									passwd:''
								});
								getInputBoxSettings(p,'SQL',data);
								break;
							case 'op':
								getJSONEditSettings(p,'OP',data.opGroups);
								break;
							case 'misc':
								getInputBoxSettings(p,'Misc',data);
								break;
						}
						indicator.stop();
					});
				};
			return {
				init:function(){
					$('#adminNav a').click(function(e){
						e.preventDefault();
						loadPage($(this).attr('page'));
					});
					settings.fetch(function(){
						page.changeLinks();
						loadPage('index');
					});
					$('#adminContent').height($(window).height() - 50);
					$(window).resize(function(){
						if(!(navigator.userAgent.match(/(iPod|iPhone|iPad)/i) && navigator.userAgent.match(/AppleWebKit/i))){
							$('#adminContent').height($(window).height() - 50);
						}
					});
				}
			};
		})(),
		options = (function(){
			var defaults = '',
				refreshCache = true,
				cache = '',
				optionMenu = [
					{
						disp:'Highlight Bold',
						id:1,
						defaultOption:'T'
					},
					{
						disp:'Highlight Red',
						id:2,
						defaultOption:'T'
					},
					{
						disp:'Colored Names',
						id:3,
						defaultOption:'F'
					},
					{
						disp:'Show extra Channels',
						id:9,
						defaultOption:'F',
						before:function(){
							alert("-READ THIS-\nNot all extra channels are owned and controlled by Omnimaga. We cannot be held liable for the content of them.\n\nBy using them, you agree to be governed by the rules inside them.\n\nOmnimaga rules still apply for OmnomIRC communication.");
							return true;
						}
					},
					{
						disp:'Alternating Line Highlight',
						id:6,
						defaultOption:'T'
					},
					{
						disp:'Enable',
						id:5,
						defaultOption:'T'
					},
					{
						disp:'Ding on Highlight',
						id:8,
						defaultOption:'F'
					},
					{
						disp:'Show Timestamps',
						id:10,
						defaultOption:'F'
					},
					{
						disp:'Show Updates in Browser Status Bar',
						id:11,
						defaultOption:'T'
					},
					{
						disp:'Show Smileys',
						id:12,
						defaultOption:'T'
					},
					{
						disp:'Hide Userlist',
						id:14,
						defaultOption:'F'
					},
					{
						disp:'Number chars for Highlighting',
						id:13,
						defaultOption:'3',
						handler:function(){
							return $('<td>')
								.attr('colspan',2)
								.css('border-right','none')
								.append($('<select>')
									.change(function(){
										options.set(13,this.value);
									})
									.append(
										$.map([0,1,2,3,4,5,6,7,8,9],function(i){
											return $('<option>')
												.attr((options.get(13,'3')==i?'selected':'false'),'selected')
												.val(i)
												.text(i+1);
										})
									)
								);
						}
					},
					{
						disp:'Show Scrollbar',
						id:15,
						defaultOption:'T'
					},
					{
						disp:'Enable Scrollwheel',
						id:16,
						defaultOption:'F'
					},
					{
						disp:'Browser Notifications',
						id:7,
						defaultOption:'F',
						before:function(){
							notification.request();
							return false;
						}
					},
					{
						disp:'Show OmnomIRC join/part messages',
						id:17,
						defaultOption:'F'
					}
				];
			return {
				setDefaults:function(d){
					defaults = d;
				},
				set:function(optionsNum,value){
					if(optionsNum < 1 || optionsNum > 40){
						return;
					}
					var optionsString = ls.get('OmnomIRCSettings'+settings.net());
					if(optionsString===null){
						ls.set('OmnomIRCSettings'+settings.net(),'----------------------------------------');
						optionsString = ls.get('OmnomIRCSettings'+settings.net());
					}
					optionsString = optionsString.substring(0,optionsNum-1)+value+optionsString.substring(optionsNum);
					ls.set('OmnomIRCSettings'+settings.net(),optionsString);
					refreshCache = true;
				},
				get:function(optionsNum,defaultOption){
					var optionsString = (refreshCache?(cache=ls.get('OmnomIRCSettings'+settings.net())):cache),
						result;
					refreshCache = false;
					if(optionsString===null){
						return defaultOption;
					}
					result = optionsString.charAt(optionsNum-1);
					if(result=='-'){
						return (defaults.charAt(optionsNum-1)!=='' && defaults.charAt(optionsNum-1)!='-'?defaults.charAt(optionsNum-1):defaultOption);
					}
					return result;
				},
				getFullOptionsString:function(){
					var optionsString = (refreshCache?(cache=ls.get('OmnomIRCSettings'+settings.net())):cache),
						res = '';
					for(var i = 0;defaults.charAt(i)!='' && optionsString.charAt(i)!='';i++){
						res += (optionsString.charAt(i)!='-' && optionsString.charAt(i)!=''?optionsString.charAt(i):(defaults.charAt(i)!=''?defaults.charAt(i):'-'));
					}
					return res;
				},
				getHTML:function(){
					return $.merge($.map([false,true],function(alternator){
							return $('<table>')
								.addClass('optionsTable')
								.append(
									$.map(optionMenu,function(o){
										return ((alternator = !alternator)?$('<tr>')
											.append(
												$.merge(
												[$('<td>')
													.text(o.disp)],
												(o.handler===undefined?[
												$('<td>')
													.addClass('option '+(options.get(o.id,o.defaultOption)=='T'?'selected':''))
													.text('Yes')
													.click(function(){
														if(options.get(o.id,o.defaultOption)=='F'){
															if((o.before!==undefined && o.before()) || o.before===undefined){
																options.set(o.id,'T');
																$(this).addClass('selected').next().removeClass('selected');
															}
														}
													}),
												$('<td>')
													.addClass('option '+(options.get(o.id,o.defaultOption)=='F'?'selected':''))
													.text('No')
													.click(function(){
														if(options.get(o.id,o.defaultOption)=='T'){
															options.set(o.id,'F');
															$(this).addClass('selected').prev().removeClass('selected');
														}
													})]:o.handler()))
											):'');
									})
								);
					}),
					$('<div>').append(
						'&nbsp;',
						$('<a>')
							.text('Reset Defaults')
							.click(function(e){
								e.preventDefault();
								ls.set('OmnomIRCSettings'+settings.net(),'----------------------------------------');
								ls.set('OmnomIRCChannels'+settings.net(),'');
								document.location.reload();
							})
					));
				}
			};
		})(),
		instant = (function(){
			var id = '',
				update = function(){
					ls.set('OmnomBrowserTab',id);
					ls.set('OmnomNewInstant','false');
				};
			return {
				init:function(){
					id = Math.random().toString(36)+(new Date()).getTime().toString();
					ls.set('OmnomBrowserTab',id);
					$(window)
						.focus(function(){
							update();
						})
						.unload(function(){
							ls.set('OmnomNewInstant','true');
						});
				},
				current:function(){
					if(ls.get('OmnomNewInstant')=='true'){
						update();
					}
					return id == ls.get('OmnomBrowserTab');
				}
			};
		}()),
		indicator = (function(){
			var interval = false,
				$elem = false,
				pixels = [];
			return {
				start:function(){
					if(interval===false){
						pixels = [true,true,true,true,true,false,false,false];
						$elem = $('<div>')
							.attr('id','indicator')
							.css({
								position:'absolute',
								zIndex:44,
								margin:0,
								padding:0,
								top:0,
								right:0
							})
							.appendTo('body');
						interval = setInterval(function(){
							$elem.empty().append(
								$.map(pixels,function(p){
									return $('<div>')
										.css({
											padding:0,
											margin:0,
											width:3,
											height:3,
											backgroundColor:(p?'black':'')
										});
								})
							);
							var temp = pixels[0],
								i;
							for(i=1;i<=7;i++){
								pixels[(i-1)] = pixels[i];
							}
							pixels[7] = temp;
						},50);
					}
				},
				stop:function(){
					if(interval!==false){
						clearInterval(interval);
						interval = false;
						$elem.remove();
					}
				}
			};
		})(),
		notification = (function(){
			var notification_support = window.webkitNotifications!==undefined && window.webkitNotifications!==null && window.webkitNotifications,
				support = function(){
					if(notification_support || (typeof Notification!='undefined' && Notification && Notification.permission!='denied')){
						return true;
					}
					return false;
				},
				show = function(s){
					var n;
					if(notification_support && window.webkitNotifications.checkPermission() === 0){
						n = window.webkitNotifications.createNotification('http://www.omnimaga.org/favicon.ico','OmnomIRC Highlight',s);
						n.show();
					}else if(typeof Notification!='undefined' && Notification && Notification.permission=='granted'){
						n = new Notification('OmnomIRC Highlight',{
							icon:'http://www.omnimaga.org/favicon.ico',
							body:s
						});
						n.onshow = function(){
							setTimeout(n.close,30000);
						};
					}
				};
			return {
				request:function(){
					if(notification_support){
						window.webkitNotifications.requestPermission(function(){
							if (window.webkitNotifications.checkPermission() === 0){
								show('Notifications Enabled!');
								options.set(7,'T');
								document.location.reload();
							}
						});
					}else if(typeof Notification!=='undefined' && Notification && Notification.permission!=='denied'){
						Notification.requestPermission(function(status){
							if (Notification.permission !== status){
								Notification.permission = status;
							}
							if(status==='granted'){
								show('Notifications Enabled!');
								options.set(7,'T');
								document.location.reload();
							}
						});
					}else{
						alert('Your browser doesn\'t support notifications');
					}
				},
				make:function(s,c){
					if(instant.current()){
						if(options.get(7,'F')=='T'){
							show(s);
						}
						if(options.get(8,'F')=='T'){
							$('#ding')[0].play();
						}
					}
					if(c!=channels.getCurrentName()){
						channels.highlight(c);
					}
				}
			};
		})(),
		request = (function(){
			var errorCount = 0,
				curLine = 0,
				inRequest = false,
				handler = false,
				send = function(){
					if(channels.getCurrent()===''){
						return;
					}
					handler = network.getJSON(
							'Update.php?high='+
							(parseInt(options.get(13,'3'),10)+1).toString()+
							'&channel='+channels.getCurrent(false,true)+
							'&lineNum='+curLine.toString()+'&'+
							settings.getUrlParams(),
						function(data){
							var newRequest = true;
							if(channels.getCurrent()===''){
								return;
							}
							handler = false;
							errorCount = 0;
							if(data.lines!==undefined){
								$.each(data.lines,function(i,line){
									return newRequest = parser.addLine(line);
								});
							}
							if(newRequest){
								setTimer();
							}
						})
						.fail(function(){
							handler = false;
							errorCount++;
							if(errorCount>=10){
								send.internal('<span style="color:#C73232;">OmnomIRC has lost connection to server. Please refresh to reconnect.</span>');
							}else if(!inRequest){
								errorCount = 0;
							}else{
								setTimer();
							}
						});
				},
				setTimer = function(){
					if(channels.getCurrent()!=='' && handler===false){
						setTimeout(function(){
							send();
						},(page.isBlurred()?2500:200));
					}else{
						request.cancel();
					}
				};
			return {
				cancel:function(){
					if(inRequest){
						inRequest = false;
						try{
							handler.abort();
						}catch(e){}
					}
				},
				start:function(){
					if(!inRequest){
						inRequest = true;
						setTimer();
					}
				},
				setCurLine:function(c){
					curLine = c;
				},
				getCurLine:function(){
					return curLine;
				}
			};
		})(),
		channels = (function(){
			var chans = [],
				current = '',
				currentb64 = '',
				currentName = '',
				save = function(){
					ls.set('OmnomIRCChannels'+settings.net(),JSON.stringify(chans));
				},
				load = function(){
					try{
						var chanList = JSON.parse(ls.get('OmnomIRCChannels'+settings.net()));
						if(chanList!==null && chanList!=[]){
							chans = $.merge(
									$.map(chanList,function(v){
										if(v.id != -1){
											var valid = false;
											$.each(chans,function(i,vc){
												if(vc.id == v.id){
													valid = true;
													v = vc;
													return false;
												}
											});
											if(!valid){
												return undefined;
											}
										}
										return v;
									}),
									$.map(chans,function(ch){
										var isNew = true;
										$.each(chanList,function(i,c){
											if(c.id == ch.id && !(ch.ex && options.get(9,'F'))){
												isNew = false;
												return false;
											}
										});
										if(isNew){
											return ch;
										}
										return undefined;
									})
								);
						}
					}catch(e){}
				},
				draw = function(){
					$('#ChanList').empty().append(
						$.map(chans,function(c,i){
							if((c.ex && options.get(9,'F')=='T') || !c.ex){
								var mouseX = 0, // new closur as in map
									startX = 0,
									initDrag = false,
									offsetX = 0,
									canClick = false,
									width = 0,
									startDrag = function(elem){
										width = $(elem).width();
										canClick = false;
										$(elem).css({
												'position':'absolute',
												'z-index':100,
												'left':mouseX - offsetX
											})
											.after(
												$('<div>')
													.attr('id','topicDragPlaceHolder')
													.css({
														'display':'inline-block',
														'width':width
													})
											)
											.addClass('dragging')
											.find('div').css('display','block').focus();
										initDrag = false;
									},
									mousedownFn = function(e,elem){
										e.preventDefault();
										startX = e.clientX;
										offsetX = startX - $(elem).position().left;
										initDrag = true;
									},
									mousemoveFn = function(e,elem){
										mouseX = e.clientX;
										if(initDrag && Math.abs(mouseX - startX) >= 4){
											initDrag = false;
											startDrag(elem);
											e.preventDefault();
										}else if($(elem).hasClass('dragging')){
											var newX = mouseX - offsetX;
											$(elem).css('left',newX);
											$ne = $('#topicDragPlaceHolder').next('.chanList');
											$pe = $('#topicDragPlaceHolder').prev('.chanList');
											if($ne.length > 0 && ($ne.position().left) < (newX + (width/2))){
												$ne.after($('#topicDragPlaceHolder').remove());
											}else if($pe.length > 0){
												if($pe.attr('id') == $(elem).attr('id')){ // we selected our own element!
													$pe = $pe.prev();
												}
												if($pe.length > 0 && $pe.position().left > newX){
													$pe.before($('#topicDragPlaceHolder').remove());
												}
											}
										}
									},
									mouseupFn = function(e,elem){
										if(initDrag){
											initDrag = false;
										}else{
											$(elem).find('div').css('display','none');
											$('#topicDragPlaceHolder').replaceWith(elem);
											chans = $.map($('.chanList'),function(chan,i){
												if($(chan).find('span').hasClass('curchan')){
													options.set(4,String.fromCharCode(i+45));
												}
												return $(chan).data('json');
											});
											save();
											draw();
										}
									};
								return $('<div>')
									.data('json',c)
									.attr('id','chan'+i.toString())
									.addClass('chanList'+(c.high?' highlightChan':''))
									.append(
										$('<span>')
											.addClass('chan '+(getHandler(i)==current?' curchan':''))
											.append(
												(c.chan.substr(0,1)!='#'?
												$('<span>')
													.addClass('closeButton')
													.css({
														width:9,
														float:'left'
													})
													.mouseup(function(){
														if(canClick){
															channels.part(i);
														}
													})
													.text('x')
												:''),
												$('<span>').text(c.chan)
											)
											.mouseup(function(){
												if(canClick){
													channels.join(i);
												}
											}),
										$('<div>')
											.css({
												'position':'fixed',
												'width':'100%',
												'height':'100%',
												'z-index':101,
												'top':0,
												'left':0,
												'display':'none'
											})
											.mousemove(function(e){
												mousemoveFn(e,$(this).parent());
											})
											.mouseup(function(e){
												mouseupFn(e,$(this).parent());
											})
											.mouseout(function(e){
												mouseupFn(e,$(this).parent());
											})
									)
									.mousedown(function(e){
										canClick = true;
										mousedownFn(e,this);
									})
									.mousemove(function(e){
										mousemoveFn(e,this);
									})
									.mouseout(function(e){
										if(initDrag){
											startDrag(this);
										}
									})
									.mouseup(function(e){
										mouseupFn(e,this);
									});
							}
						})
					);
				},
				requestHandler = false,
				getHandler = function(i,b64){
					if(chans[i].id!=-1){
						return chans[i].id;
					}
					if(b64){
						return base64.encode(chans[i].chan);
					}
					return chans[i].chan;
				};
			return {
				highlight:function(c){
					$.each(chans,function(i,ci){
						if(ci.chan==c){
							$('#chan'+i.toString()).addClass('highlightChan');
						}
					});
				},
				openChan:function(s){
					var addChan = true;
					s = s.trim();
					if(s.substr(0,1) != '@' && s.substr(0,1) != '#'){
						s = '@' + s;
					}
					s = s.toLowerCase();
					$.each(chans,function(i,c){
						if(c.chan==s){
							addChan = i;
						}
					});
					if(addChan===true){
						if(s.substr(0,1)=='#'){
							send.internal('<span style="color:#C73232;"> Join Error: Cannot join new channels starting with #.</span>');
							return;
						}
						chans.push({
							chan:s,
							high:false,
							ex:false,
							id:-1,
							order:-1
						});
						save();
						draw();
						channels.join(chans.length-1);
					}else{
						channels.join(addChan);
					}
				},
				openPm:function(s,join){
					var addChan = true;
					if(join===undefined){
						join = false;
					}
					s = s.trim();
					if(s.substr(0,1)=='@' || s.substr(0,1)=='#'){
						send.internal('<span style="color:#C73232;"> Query Error: Cannot query a channel. Use /join instead.</span>');
						return;
					}
					s = s.toLowerCase();
					if(s.substr(0,1)!='*'){
						s = '*'+s;
					}
					$.each(chans,function(i,c){
						if(c.chan==s){
							addChan = i;
						}
					});
					if(addChan===true){
						chans.push({
							chan:s,
							high:!join,
							ex:false,
							id:-1,
							order:-1
						});
						save();
						draw();
						if(join){
							channels.join(chans.length-1);
						}
					}else{
						chans[addChan].high = !join;
						if(join){
							channels.join(addChan);
						}
					}
				},
				part:function(i){
					var select = false;
					if(i===undefined){
						$.each(chans,function(ci,c){
							if(c.chan == current || c.id == current){
								i = ci;
							}
						});
					}
					if(isNaN(parseInt(i,10))){
						$.each(chans,function(ci,c){
							if(c.chan == i){
								i = ci;
							}
						});
					}
					if(isNaN(parseInt(i,10)) || i===undefined){
						send.internal('<span style="color:#C73232;"> Part Error: I cannot part '+i+'. (You are not in it.)</span>');
						return;
					}
					i = parseInt(i,10);
					if(chans[i].chan.substr(0,1)=='#'){
						send.internal('<span style="color:#C73232;"> Part Error: I cannot part '+chans[i].chan+'. (IRC channel.)</span>');
						return;
					}
					if(getHandler(i) == current){
						select = true;
					}
					chans.splice(i,1);
					save();
					draw();
					if(select){
						channels.join(i-1);
					}
				},
				join:function(i,fn){
					if(chans[i]!==undefined){
						indicator.start();
						request.cancel();
						$('#message').attr('disabled','true');
						$('#MessageBox').empty();
						$('.chan').removeClass('curchan');
						if(requestHandler!==false){
							requestHandler.abort();
						}
						requestHandler = network.getJSON('Load.php?count=125&channel='+getHandler(i,true)+'&'+settings.getUrlParams(),function(data){
							current = getHandler(i);
							currentb64 = getHandler(i,true);
							currentName = chans[i].chan;
							oldMessages.read();
							options.set(4,String.fromCharCode(i+45));
							if(!data.banned){
								if(data.admin){
									$('#adminLink').css('display','block');
								}else{
									$('#adminLink').css('display','none');
								}
								users.setUsers(data.users);
								users.draw();
								$.each(data.lines,function(i,line){
									parser.addLine(line);
								});
								scroll.down();
								requestHandler = false;
								request.start();
							}else{
								send.internal('<span style="color:#C73232;"><b>ERROR:</b> banned</banned>');
								requestHandler = false;
							}
							$('#chan'+i.toString()).removeClass('highlightChan').find('.chan').addClass('curchan');
							if(fn!==undefined){
								fn();
							}
							if(settings.nick()!=''){
								$('#message').removeAttr('disabled');
							}
							indicator.stop();
						});
					}
				},
				getCurrent:function(override,b64){
					if(requestHandler===false || override){
						return (b64?currentb64:current);
					}
					return '';
				},
				getCurrentName:function(){
					if(requestHandler===false){
						return currentName;
					}
					return '';
				},
				init:function(){
					load();
					draw();
				},
				setChans:function(c){
					chans = c;
				},
				getChans:function(){
					return chans;
				}
			};
		})(),
		tab = (function(){
			var tabWord = '',
				tabCount = 0,
				isInTab = false,
				startPos = 0,
				startChar = '',
				endPos = 0,
				endChar = '',
				endPos0 = 0,
				tabAppendStr = ' ',
				getCurrentWord = function(){
					var message = $('#message')[0];
					if(isInTab){
						return tabWord;
					}
					startPos = endPos = message.selectionStart;
					startChar = message.value.charAt(startPos);
					while(startChar != ' ' && --startPos > 0){
						startChar = message.value.charAt(startPos);
					}
					if(startChar == ' '){
						startPos++;
					}
					endChar = message.value.charAt(endPos);
					while(endChar != ' ' && ++endPos <= message.value.length){
						endChar = message.value.charAt(endPos);
					}
					endPos0 = endPos;
					return message.value.substr(startPos,endPos - startPos).trim();
				},
				getTabComplete = function(){
					var message = $('#message')[0],
						name;
					if(!isInTab){
						tabAppendStr = ' ';
						startPos = message.selectionStart;
						startChar = message.value.charAt(startPos);
						while(startChar != ' ' && --startPos > 0){
							startChar = message.value.charAt(startPos);
						}
						if(startChar == ' '){
							startChar+=2;
						}
						if(startPos===0){
							tabAppendStr = ': ';
						}
						endPos = message.selectionStart;
						endChar = message.value.charAt(endPos);
						while(endChar != ' ' && ++endPos <= message.value.length){
							endChar = message.value.charAt(endPos);
						}
						if(endChar == ' '){
							endChar-=2;
						}
					}
					name = users.search(getCurrentWord(),tabCount);
					if(name == getCurrentWord()){
						tabCount = 0;
						name = users.search(getCurrentWord(),tabCount);
					}
					message.value = message.value.substr(0,startPos)+name+tabAppendStr+message.value.substr(endPos+1);
					endPos = endPos0+name.length;
				};
			return {
				init:function(){
					$('#message')
						.keydown(function(e){
							if(e.keyCode == 9){
								if(!e.ctrlKey){
									e.preventDefault();
									
									tabWord = getCurrentWord();
									getTabComplete();
									tabCount++;
									isInTab = true;
									setTimeout(1,1);
								}
							}else{
								tabWord = '';
								tabCount = 0;
								isInTab = false;
							}
						});
				}
			};
		})(),
		users = (function(){
			var usrs = [],
				exists = function(u){
					var result = false;
					$.each(usrs,function(i,us){
						if(us.nick.toLowerCase() == u.nick.toLowerCase() && us.network == u.network){
							result = true;
							return false;
						}
					});
					return result;
				};
			return {
				search:function(start,startAt){
					var res = false;
					if(!startAt){
						startAt = 0;
					}
					$.each(usrs,function(i,u){
						if(u.nick.toLowerCase().indexOf(start.toLowerCase()) === 0 && startAt-- <= 0 && res === false){
							res = u.nick;
						}
					});
					if(res!==false){
						return res;
					}
					return start;
				},
				add:function(u){
					if(channels.getCurrent()!==''){
						usrs.push(u);
						users.draw();
					}
				},
				remove:function(u){
					if(channels.getCurrent()!==''){
						$.each(usrs,function(i,us){
							if(us.nick == u.nick && us.network == u.network){
								usrs.splice(i,1);
								return false;
							}
						});
						users.draw();
					}
				},
				draw:function(){
					usrs.sort(function(a,b){
						var al=a.nick.toLowerCase(),bl=b.nick.toLowerCase();
						return al==bl?(a==b?0:a<b?-1:1):al<bl?-1:1;
					});
					$('#UserList').empty().append(
						$.map(usrs,function(u){
							var getInfo,
								ne = encodeURIComponent(u.nick),
								n = $('<span>').text(u.nick).html();
							return $('<span>')
								.attr('title',(settings.networks()[u.network]!==undefined?settings.networks()[u.network].name:'Unknown Network'))
								.append(
									(settings.networks()[u.network]!==undefined?settings.networks()[u.network].userlist.split('NICKENCODE').join(ne).split('NICK').join(n):n),
									'<br>'
								)
								.mouseover(function(){
									getInfo = network.getJSON('Load.php?userinfo&name='+base64.encode(u.nick)+'&chan='+channels.getCurrent(false,true)+'&online='+u.network.toString(),function(data){
										if(data.last){
											$('#lastSeenCont').text('Last Seen: '+(new Date(data.last*1000)).toLocaleString());
										}else{
											$('#lastSeenCont').text('Last Seen: never');
										}
										$('#lastSeenCont').css('display','block');
									});
								})
								.mouseout(function(){
									try{
										getInfo.abort();
									}catch(e){}
									$('#lastSeenCont').css('display','none');
								});
						}),
						'<br><br>'
					);
				},
				setUsers:function(u){
					usrs = u;
				}
			};
		})(),
		topic = (function(){
			var current = '';
			return {
				set:function(t){
					$('#topic').empty().append(t);
					current = t;
				}
			};
		})(),
		scroll = (function(){
			var isDown = false,
				enableButtons = function(){
					var addHook = function(elem,effect,inc){
							var interval;
							$(elem)
								.mousedown(function(){
									interval = setInterval(function(){
										document.getElementById(effect).scrollLeft += inc;
									},50);
								})
								.mouseup(function(){
									try{
										clearInterval(interval);
									}catch(e){}
								})
								.mouseout(function(){
									try{
										clearInterval(interval);
									}catch(e){}
								});
						};
					addHook('#arrowLeftChan','ChanListCont',-9);
					addHook('#arrowRightChan','ChanListCont',9);
					
					addHook('#arrowLeftTopic','topicCont',-9);
					addHook('#arrowRightTopic','topicCont',9);
					
				},
				enableWheel = function(){
					$('#mBoxCont').bind('DOMMouseScroll mousewheel',function(e){
						e.preventDefault();
						e.stopPropagation();
						e.cancelBubble = true;
						isDown = false;
						document.getElementById('mBoxCont').scrollTop = Math.min(document.getElementById('mBoxCont').scrollHeight-document.getElementById('mBoxCont').clientHeight,Math.max(0,document.getElementById('mBoxCont').scrollTop-(/Firefox/i.test(navigator.userAgent)?(e.originalEvent.detail*(-20)):(e.originalEvent.wheelDelta/2))));
						if(document.getElementById('mBoxCont').scrollTop==(document.getElementById('mBoxCont').scrollHeight-document.getElementById('mBoxCont').clientHeight)){
							isDown = true;
						}
						if(options.get(15,'T')=='T'){
							reCalcBar();
						}
					});
				},
				reCalcBar = function(){
					if($('#scrollBar').length!==0){
						$('#scrollBar').css('top',(document.getElementById('mBoxCont').scrollTop/(document.getElementById('mBoxCont').scrollHeight-document.getElementById('mBoxCont').clientHeight))*($('body')[0].offsetHeight-$('#scrollBar')[0].offsetHeight-38)+38);
					}
				},
				enableUserlist = function(){
					$('#UserList')
						.css('top',0)
						.bind('DOMMouseScroll mousewheel',function(e){
							if(e.preventDefault){
								e.preventDefault();
							}
							e = e.originalEvent;
							$(this).css('top',Math.min(0,Math.max(((/Opera/i.test(navigator.userAgent))?-30:0)+document.getElementById('UserListInnerCont').clientHeight-this.scrollHeight,parseInt(this.style.top,10)+(/Firefox/i.test(navigator.userAgent)?(e.detail*(-20)):(e.wheelDelta/2)))));
						});
						
				},
				showBar = function(){
					var mouseMoveFn = function(e){
							var y = e.clientY;
							if($('#scrollBar').data('isClicked')){
								$('#scrollBar').css('top',parseInt($('#scrollBar').css('top'),10)+(y-$('#scrollBar').data('prevY')));
								document.getElementById('mBoxCont').scrollTop = ((parseInt($('#scrollBar').css('top'),10)-38)/($('body')[0].offsetHeight-$('#scrollBar')[0].offsetHeight-38))*(document.getElementById('mBoxCont').scrollHeight-document.getElementById('mBoxCont').clientHeight);
								isDown = false;
								if(parseInt($('#scrollBar').css('top'),10)<38){
									$('#scrollBar').css('top',38);
									document.getElementById('mBoxCont').scrollTop = 0;
								}
								if(parseInt($('#scrollBar').css('top'),10)>($('body')[0].offsetHeight-$('#scrollBar')[0].offsetHeight)){
									$('#scrollBar').css('top',$('body')[0].offsetHeight-$('#scrollBar')[0].offsetHeight);
									document.getElementById('mBoxCont').scrollTop =  $('#mBoxCont').prop('scrollHeight')-$('#mBoxCont')[0].clientHeight;
									isDown = true;
								}
							}
							$('#scrollBar').data('prevY',y);
						},
						mouseDownFn = function(){
							$('#scrollBar').data('isClicked',true);
							$('#scrollArea').css('display','block');
						},
						mouseUpFn = function(){
							$('#scrollBar').data('isClicked',false);
							$('#scrollArea').css('display','none');
						},
						$bar = $('<div>').attr('id','scrollBar').data({prevY:0,isClicked:false}).appendTo('body')
							.mousemove(function(e){
								mouseMoveFn(e);
							})
							.mousedown(function(){
								mouseDownFn();
							})
							.mouseup(function(){
								mouseUpFn();
							});
					$bar.css('top',$('body')[0].offsetHeight-$bar[0].offsetHeight);
					$('<div>')
						.attr('id','scrollArea')
						.css({
							display:'none',
							width:'100%',
							height:'100%',
							position:'absolute',
							left:0,
							top:0,
							zIndex:100
						})
						.mousemove(function(e){
							mouseMoveFn(e);
						})
						.mouseup(function(){
							mouseUpFn();
						})
						.mouseout(function(){
							mouseUpFn();
						})
						.appendTo('body');
					$('<div>')
						.attr('id','scrollBarLine')
						.appendTo('body');
					$(window).trigger('resize');
				},
				showButtons = function(){
					var downIntM,upIntM;
					$('<span>')
						.addClass('arrowButtonHoriz3')
						.append(
							$('<div>')
								.css({
									fontSize:'12pt',
									width:12,
									height:'9pt',
									top:0,
									position:'absolute',
									fontWeight:'bolder',
									marginTop:'10pt',
									marginLeft:'-10pt'
								})
								.addClass('arrowButtonHoriz2')
								.html('&#9650;'),
							$('<div>')
								.css({
									fontSize:'12pt',
									width:12,
									height:'9pt',
									top:0,
									position:'absolute',
									marginTop:'10pt',
									marginLeft:'-10pt'
								})
								.mousedown(function(){
									downIntM = setInterval(function(){
										document.getElementById('mBoxCont').scrollTop -= 9;
										isDown = false;
									},50);
								})
								.mouseout(function(){
									try{
										clearInterval(downIntM);
									}catch(e){}
								})
								.mouseup(function(){
									try{
										clearInterval(downIntM);
									}catch(e){}
								})
						).appendTo('body');
					$('<span>')
						.addClass('arrowButtonHoriz3')
						.append(
							$('<div>')
								.css({
									fontSize:'12pt',
									width:12,
									height:'9pt',
									bottom:'9pt',
									position:'absolute',
									fontWeight:'bolder',
									marginTop:'-10pt',
									marginLeft:'-10pt'
								})
								.addClass('arrowButtonHoriz2')
								.html('&#9660;'),
							$('<div>')
								.css({
									fontSize:'12pt',
									width:12,
									height:'9pt',
									bottom:'9pt',
									position:'absolute',
									marginTop:'-10pt',
									marginLeft:'-10pt'
								})
								.mousedown(function(){
									upIntM = setInterval(function(){
										document.getElementById('mBoxCont').scrollTop += 9;
										if(document.getElementById('mBoxCont').scrollTop+document.getElementById('mBoxCont').clientHeight==document.getElementById('mBoxCont').scrollHeight){
											isDown = true;
										}
									},50);
								})
								.mouseout(function(){
									try{
										clearInterval(upIntM);
									}catch(e){}
								})
								.mouseup(function(){
									try{
										clearInterval(upIntM);
									}catch(e){}
								})
						).appendTo('body');
				};
			return {
				down:function(){
					document.getElementById('mBoxCont').scrollTop = $('#mBoxCont').prop('scrollHeight');
					isDown = true;
				},
				up:function(){
					document.getElementById('mBoxCont').scrollTop = 0;
					isDown = false;
				},
				slide:function(){
					if(isDown){
						scroll.down();
					}
				},
				init:function(){
					enableButtons();
					if(options.get(15,'T')=='T'){
						showBar();
					}else{
						showButtons();
					}
					if(options.get(16,'F')=='T'){
						enableWheel();
					}
					enableUserlist();
					$('#mBoxCont').scroll(function(e){
						reCalcBar();
					});
					$(document).add(window).add('body').add('html').scroll(function(e){
						e.preventDefault();
					});
				},
				reCalcBar:reCalcBar
			};
		})(),
		page = (function(){
			var initSmileys = function(){
					if(options.get(12,'T')=='T'){
						$('#smileyMenuButton')
							.css('cursor','pointer')
							.click(function(){
									if($('#smileyselect').css('display')=='block'){
										$('#smileyselect').css('display','none');
										$(this).attr('src','smileys/smiley.gif');
									}else{
										$('#smileyselect').css('display','block');
										$(this).attr('src','smileys/tongue.gif');
									}
							});
					}else{
						$('#smileyMenuButton')
							.attr('src','smileys/smiley_grey.png');
					}
					$('#smileyselect').append(
						$.map(parser.getSmileys(),function(s){
							return [(s.inMenu?($('<img>')
								.attr({
									src:s.pic,
									alt:s.alt,
									title:s.title
								})
								.click(function(){
									replaceText(' '+s.code,$('#message')[0]);
								})):''),' '];
								
						})
					);
				},
				mBoxContWidthOffset = 99,
				registerToggle = function(){
					$('#toggleButton')
						.click(function(e){
							e.preventDefault();
							options.set(5,!(options.get(5,'T')=='T')?'T':'F');
							document.location.reload();
						});
				},
				isBlurred = false,
				init = function(){
					page.changeLinks();
					$('#windowbg2').css('height',parseInt($('html').height(),10) - parseInt($('#message').height() + 14,10));
					$('#mBoxCont').css('height',parseInt($('#windowbg2').height(),10) - 42);
					$(window).resize(function(){
						if(!(navigator.userAgent.match(/(iPod|iPhone|iPad)/i) && navigator.userAgent.match(/AppleWebKit/i))){
							$('#windowbg2').css('height',parseInt($('html').height(),10) - parseInt($('#message').height() + 14,10));
							$('#mBoxCont').css('height',parseInt($('#windowbg2').height(),10) - 42);
						}
						if(options.get(15,'T')=='T'){
							$('#mBoxCont').css('width',((document.body.offsetWidth/100)*mBoxContWidthOffset)-22);
							scroll.reCalcBar();
						}
						scroll.down();
					}).trigger('resize').blur(function(){
						isBlurred = true;
					}).focus(function(){
						isBlurred = false;
					});
					if(options.get(14,'F')!='T'){ // hide userlist is off
						mBoxContWidthOffset = 90;
						$('<style>')
							.append(
								'#scrollBar{left:89%;left:calc(90% - 17px);}',
								'#scrollBarLine{left:89%;left:calc(90% - 16px);}',
								'#message{width:82%;width:calc(91% - 115px);width:-webkit-calc(91% - 115px);}',
								'#mBoxCont{width:90%;}',
								'.arrowButtonHoriz2,.arrowButtonHoriz3 > div:nth-child(2){left:89%;left:calc(90% - 5px);left:-webkit-calc(90% - 5px);}',
								'#UserListContainer{left:90%;height:100%;transition:none;-webkit-transition:none;-o-transition-property:none;-o-transition-duration:none;-o-transition-delay:none;}',
								'#icons{right:270px;}'
							)
							.appendTo('head');
					}
					scroll.init();
					tab.init();
					instant.init();
					logs.init();
					registerToggle();
					$('#aboutButton').click(function(e){
						e.preventDefault();
						$('#about').toggle();
					});
				};
			return {
				load:function(){
					indicator.start();
					settings.fetch(function(){
						if(options.get(5,'T')=='T'){
							init();
							initSmileys();
							send.init();
							oldMessages.init();
							channels.init();
							channels.join(options.get(4,String.fromCharCode(45)).charCodeAt(0) - 45);
						}else{
							registerToggle();
							$('#windowbg2').css('height',parseInt($('html').height(),10) - parseInt($('#message').height() + 14,10));
							$('#mBoxCont').css('height',parseInt($('#windowbg2').height(),10) - 42).empty().append(
								'<br>',
								$('<a>')
									.css('font-size',20)
									.text('OmnomIRC is disabled. Click here to enable.')
									.click(function(e){
										e.preventDefault();
										options.set(5,'T');
										window.location.reload();
									})
							);
							indicator.stop();
						}
					});
				},
				isBlurred:function(){
					return isBlurred;
				},
				changeLinks:function(){
					// change links to add network
					$('#adminLink a,a[href="."],a[href="?options"],a[href="index.php"]').each(function(){
						if($(this).attr('href').split('?')[1] !== undefined){
							$(this).attr('href',$(this).attr('href')+'&network='+settings.net());
						}else{
							$(this).attr('href',$(this).attr('href')+'?network='+settings.net());
						}
					});
				}
			};
		})(),
		statusBar = (function(){
			var text = '',
				started = false,
				start = function(){
					if(options.get(11,'T')!='T'){
						return;
					}
					if(!started){
						setInterval(function(){
							window.status = text;
							if(parent){
								try{
									parent.window.status = text;
								}catch(e){}
							}
						},500);
						started = true;
					}
				};
			return {
				set:function(s){
					text = s;
					if(!started){
						start();
					}
				}
			};
		})(),
		commands = (function(){
			return {
				parse:function(s){
					var command = s.split(' ')[0].toLowerCase(),
						parameters = s.substr(command.length+1).toLowerCase().trim();
					switch(command){
						case 'j':
						case 'join':
							channels.openChan(parameters);
							return true;
						case 'q':
						case 'query':
							channels.openPm(parameters,true);
							return true;
						case 'win':
						case 'w':
						case 'window':
							if(parseInt(parameters,10) < channels.getChans().length && parseInt(parameters,10) >= 0){
								channels.join(parseInt(parameters,10));
							}
							return true;
						case 'p':
						case 'part':
							channels.part((parameters!==''?parameters:undefined));
							return true;
						case 'help':
							send.internal('<span style="color:#2A8C2A;">Commands: me, ignore, unignore, ignorelist, join, part, query, msg, window</span>');
							send.internal('<span style="color:#2A8C2A;">For full help go here: <a href="http://ourl.ca/19926" target="_top">http://ourl.ca/19926</a></span>');
							return true;
						case 'ponies':
							var fs=document.createElement("script");fs.onload=function(){
								Derpy();
							};
							fs.src="http://juju2143.ca/mousefly.js";
							document.head.appendChild(fs);
							return true;
						default:
							return false;
					}
				}
			};
		})(),
		oldMessages = (function(){
			var messages = [],
				counter = 0,
				current = '';
			return {
				init:function(){
					$('#message')
						.keydown(function(e){
							if(e.keyCode==38 || e.keyCode==40){
								e.preventDefault();
								if(counter==messages.length){
									current = $(this).val();
								}
								if(messages.length!==0){
									if(e.keyCode==38){ //up
										if(counter!==0){
											counter--;
										}
										$(this).val(messages[counter]);
									}else{ //down
										if(counter!=messages.length){
											counter++;
										}
										if(counter==messages.length){
											$(this).val(current);
										}else{
											$(this).val(messages[counter]);
										}
									}
								}
							}
						});
				},
				add:function(s){
					messages.push(s);
					if(messages.length>20){
						messages.shift();
					}
					counter = messages.length;
					ls.set('oldMessages-'+channels.getCurrent(false,true),messages.join("\n"));
				},
				read:function(){
					var temp = ls.get('oldMessages-'+channels.getCurrent(false,true));
					if(temp!==null){
						messages = temp.split("\n");
					}else{
						messages = [];
					}
					counter = messages.length;
				}
			};
		})(),
		send = (function(){
			var sending = false,
				sendMessage = function(s){
					oldMessages.add(s);
					if(s[0] == '/' && commands.parse(s.substr(1))){
						$('#message').val('');
					}else{
						if(!sending){
							sending = true;
							request.cancel();
							network.getJSON('message.php?message='+base64.encode(s)+'&channel='+channels.getCurrent(false,true)+'&'+settings.getUrlParams(),function(){
								$('#message').val('');
								request.start();
								sending = false;
							});
							if(s.search('goo.gl/QMET')!=-1 || s.search('oHg5SJYRHA0')!=-1 || s.search('dQw4w9WgXcQ')!=-1){
								$('<div>')
									.css({
										position:'absolute',
										zIndex:39,
										top:39,
										left:0
									})
									.html('<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0"><param name="movie" value="http://134.0.27.190/juju/i-lost-the-ga.me/rickroll.swf"><param name="quality" value="high"><embed src="http://134.0.27.190/juju/i-lost-the-ga.me/rickroll.swf" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash"></embed></object>')
									.appendTo('body');
							}
						}
					}
				};
			return {
				internal:function(s){
					parser.addLine({
						curLine:0,
						type:'internal',
						time:Math.floor((new Date()).getTime()/1000),
						name:'',
						message:s,
						name2:'',
						chan:channels.getCurrent()
					});
				},
				init:function(){
					if(settings.nick()!=''){
						$('#sendMessage')
							.submit(function(e){
								e.preventDefault();
								if(!$('#message').attr('disabled') && $('#message').val()!==''){
									sendMessage(this.message.value);
								}
							});
					}else{
						$('#message')
							.attr('disabled','true')
							.val('You need to login if you want to chat!');
					}
				}
			};
		})(),
		logs = (function(){
			var isOpen = false,
				open = function(){
					var d = new Date();
					indicator.start();
					request.cancel();
					$('#message').attr('disabled','true');
					users.setUsers([]); //empty userlist
					users.draw();
					$('#chattingHeader').css('display','none');
					$('#logsHeader').css('display','block');
					
					$('#logChanIndicator').text(channels.getCurrentName());
					
					$('#logDate').val(parseInt(d.getDate(),10)+'-'+parseInt(d.getMonth()+1,10)+'-'+parseInt(d.getFullYear(),10));
					isOpen = true;
					fetch();
				},
				close = function(){
					var num;
					
					$('#chattingHeader').css('display','block');
					$('#logsHeader').css('display','none');
					$.each(channels.getChans(),function(i,c){
						if(c.chan==channels.getCurrent() || c.id==channels.getCurrent()){
							num = i;
							return false;
						}
					});
					channels.join(num);
					isOpen = false;
				},
				fetchPart = function(n){
					network.getJSON('Log.php?day='+base64.encode($('#logDate').val())+'&offset='+parseInt(n,10)+'&channel='+channels.getCurrent(false,true)+'&'+settings.getUrlParams(),function(data){
						if(!data.banned){
							if(data.lines.length>=1000){
								fetchPart(n+1000);
							}
							$.each(data.lines,function(i,line){
								parser.addLine(line,true);
							});
							scroll.up();
							if(data.lines.length<1000){
								indicator.stop();
							}
						}else{
							send.internal('<span style="color:#C73232;"><b>ERROR:</b> banned</banned>');
						}
					});
				},
				fetch = function(){
					indicator.start();
					
					$('#MessageBox').empty();
					
					fetchPart(0);
				},
				toggle = function(){
					if(isOpen){
						close();
					}else{
						open();
					}
				};
			return {
				init:function(){
					$('#logCloseButton')
						.click(function(e){
							e.preventDefault();
							close();
						});
					$('#logGoButton')
						.click(function(e){
							e.preventDefault();
							fetch();
						});
					$('#logsButton').click(function(e){
						e.preventDefault();
						toggle();
					});
					//$('#logDate').datepicker();
				}
			};
		})();
		parser = (function(){
			var smileys = [],
				maxLines = 200,
				lastMessage = 0,
				parseName = function(n,o){
					n = (n=="\x00"?'':n); //fix 0-string bug
					var ne = encodeURIComponent(n);
					n = $('<span>').text(n).html();
					var rcolors = [19,20,22,24,25,26,27,28,29],
						sum = 0,
						i = 0,
						cn = n;
					if(options.get(3,'F')=='T'){
						while(n[i]){
							sum += n.charCodeAt(i++);
						}
						cn = $('<span>').append($('<span>').addClass('uName-'+rcolors[sum %= 9].toString()).html(n)).html();
					}else{
						cn = n;
					}
					if(settings.networks()[o]!==undefined){
						return '<span title="'+settings.networks()[o].name+'">'+settings.networks()[o].normal.split('NICKENCODE').join(ne).split('NICK').join(cn)+'</span>';
					}
					return '<span title="Unknown Network">'+cn+'</span>';
				},
				parseSmileys = function(s){
					var addStuff = '';
					if(!s){
						return '';
					}
					$.each(smileys,function(i,smiley){
						s = s.replace(RegExp(smiley.regex,'g'),smiley.replace.split('ADDSTUFF').join(addStuff).split('PIC').join(smiley.pic).split('ALT').join(smiley.alt));
					});
					return s;
				},
				parseLinks = function(text){
					text = text.replace(/(\x01)/g,"");
					if (!text || text === null || text === undefined){
						return;
					}
					//text = text.replace(/http:\/\/www\.omnimaga\.org\//g,"\x01www.omnimaga.org/");
					text = text.replace(/http:\/\/ourl\.ca\//g,"\x01ourl.ca/");
					text = text.replace(/((h111:\/\/(www\.omnimaga\.org\/|ourl\.ca))[-a-zA-Z0-9@:;%_+.~#?&//=]+)/, '<a target="_top" href="$1">$1</a>');
					text = text.replace(RegExp("(^|.)(((f|ht)(tp|tps):\/\/)[^\\s\x02\x03\x0f\x16\x1d\x1f]*)","g"),'$1<a target="_blank" href="$2">$2</a>');
					text = text.replace(RegExp("(^|\\s)(www\\.[^\\s\x02\x03\x0f\x16\x1d\x1f]*)","g"),'$1<a target="_blank" href="http://$2">$2</a>');
					text = text.replace(RegExp("(^|.)\x01([^\\s\x02\x03\x0f\x16\x1d\x1f]*)","g"),'$1<a target="_top" href="http://$2">http://$2</a>');
					return text;
				},
				parseColors = function(colorStr){
					var arrayResults = [],
						isBool = false,
						numSpan = 0,
						isItalic = false,
						isUnderline = false,
						s,
						colorStrTemp = '1,0';
					if(!colorStr){
						return '';
					}
					colorStr = colorStr.split("\x16\x16").join('')+"\x0f";
					arrayResults = colorStr.split(RegExp("([\x02\x03\x0f\x16\x1d\x1f])"));
					colorStr='';
					var i,j;
					for(i=0;i<arrayResults.length;i++){
						switch(arrayResults[i]){
							case "\x03":
								for(j=0;j<numSpan;j++){
									colorStr+="</span>";
								}
								numSpan=1;
								i++;
								colorStrTemp = arrayResults[i];
								s=arrayResults[i].replace(/^([0-9]{1,2}),([0-9]{1,2})/g,"<span class=\"fg-$1\"><span class=\"bg-$2\">");
								if(s==arrayResults[i]){
									s=arrayResults[i].replace(/^([0-9]{1,2})/g,"<span class=\"fg-$1\">");
								}else{
									numSpan++;
								}
								colorStr+=s;
								break;
							case "\x02":
								isBool = !isBool;
								if (isBool){
									colorStr+="<b>";
								}else{
									colorStr+="</b>";
								}
								break;
							case "\x1d":
								isItalic = !isItalic;
								if(isItalic){
									colorStr+="<i>";
								}else{
									colorStr+="</i>";
								}
								break;
							case "\x16":
								for(j=0;j<numSpan;j++)
									colorStr+="</span>";
								numSpan=2;
								var stemp;
								s=colorStrTemp.replace(/^([0-9]{1,2}),([0-9]{1,2}).+/g,"<span class=\"fg-$2\"><span class=\"bg-$1\">");
								stemp=colorStrTemp.replace(/^([0-9]{1,2}),([0-9]{1,2}).+/g,"$2,$1");
								if(s==colorStrTemp){
									s=colorStrTemp.replace(/^([0-9]{1,2}).+/g,"<span class=\"fg-0\"><span class=\"bg-$1\">");
									stemp=colorStrTemp.replace(/^([0-9]{1,2}).+/g,"0,$1");
								}
								colorStrTemp = stemp;
								colorStr+=s;
								break;
							case "\x1f":
								isUnderline = !isUnderline;
								if(isUnderline){
									colorStr+="<u>";
								}else{
									colorStr+="</u>";
								}
								break;
							case "\x0f":
								if(isUnderline){
									colorStr+="</u>";
									isUnderline=false;
								}
								if(isItalic){
									colorStr+="</i>";
									isItalic=false;
								}
								if(isBool){
									colorStr+="</b>";
									isBool = false;
								}
								for(j=0;j<numSpan;j++)
									colorStr+="</span>";
								numSpan=0;
								break;
							default:
								colorStr+=arrayResults[i];
						}
					}
					/*Strip codes*/
					colorStr = colorStr.replace(/(\x03|\x02|\x1F|\x09|\x0F)/g,"");
					return colorStr;
				},
				parseHighlight = function(s){
					if(s.toLowerCase().indexOf(settings.nick().toLowerCase().substr(0,parseInt(options.get(13,'3'),10)+1)) >= 0 && settings.nick() != ''){
						var style = '';
						if(options.get(2,'T')!='T'){
							style += 'background:none;padding:none;border:none;';
						}
						if(options.get(1,'T')=='T'){
							style += 'font-weight:bold;';
						}
						return '<span class="highlight" style="'+style+'">'+s+'</span>';
					}
					return s;
				},
				parseMessage = function(s){
					s = (s=="\x00"?'':s); //fix 0-string bug
					s = $('<span>').text(s).html();
					s = parseLinks(s);
					if(options.get(12,'T')=='T'){
						s = parseSmileys(s);
					}
					s = parseColors(s);
					return s;
				},
				lineHigh = false;
			return {
				addLine:function(line,logMode){
					var $mBox = $('#MessageBox'),
						name = parseName(line.name,line.network),
						message = parseMessage(line.message),
						tdName = '*',
						tdMessage = message,
						addLine = true,
						statusTxt = '';
					if((line.type == 'message' || line.type == 'action') && line.name.toLowerCase() != 'new'){
						tdMessage = message = parseHighlight(message);
					}
					if(line.curLine > request.getCurLine()){
						request.setCurLine(line.curLine);
					}
					switch(line.type){
						case 'reload':
							addLine = false;
							if(logMode!==true && channels.getCurrent()!==''){
								var num;
								$.each(channels.getChans(),function(i,c){
									if(c.chan==channels.getCurrent() || c.id==channels.getCurrent()){
										num = i;
										return false;
									}
								});
								channels.join(num);
								return false;
							}
							break;
						case 'join':
							tdMessage = [name,' has joined '+channels.getCurrentName()];
							if(logMode!==true){
								users.add({
									nick:line.name,
									network:line.network
								});
							}
							if(line.network==1 && options.get(17,'F')=='F'){
								addLine = false;
							}
							break;
						case 'part':
							tdMessage = [name,' has left '+channels.getCurrentName()+' (',message,')'];
							if(logMode!==true){
								users.remove({
									nick:line.name,
									network:line.network
								});
							}
							if(line.network==1 && options.get(17,'F')=='F'){
								addLine = false;
							}
							break;
						case 'quit':
							tdMessage = [name,' has quit IRC (',message,')'];
							if(logMode!==true){
								users.remove({
									nick:line.name,
									network:line.network
								});
							}
							if(line.network==1){
								addLine = false;
							}
							break;
						case 'kick':
							tdMessage = [name,' has kicked ',parseName(line.name2,line.network),' from '+channels.getCurrentName()+' (',message,')'];
							if(logMode!==true){
								users.remove({
									nick:line.name2,
									network:line.network
								});
							}
							break;
						case 'message':
							tdName = name;
							break;
						case 'action':
							tdMessage = [name,' ',message];
							break;
						case 'mode':
							if(typeof(message)=='string'){
								message = message.split(' ');
								$.each(message,function(i,v){
									var n = $('<span>').html(v).text();
									if(n.indexOf('+')==-1 && n.indexOf('-')==-1){
										message[i] = parseName(v,line.network);
									}
								});
								message = message.join(' ');
							}
							tdMessage = [name,' set '+channels.getCurrentName()+' mode ',message];
							break;
						case 'nick':
							tdMessage = [name,' has changed nicks to ',parseName(line.name2,line.network)];
							if(logMode!==true){
								users.add({
									nick:line.name2,
									network:line.network
								});
								users.remove({
									nick:line.name,
									network:line.network
								});
							}
							break;
						case 'topic':
							topic.set(message);
							tdMessage = [name,' has changed the topic to ',message];
							if(line.network==-1){
								addLine = false;
							}
							break;
						case 'pm':
							if(channels.getCurrent(true).toLowerCase() != '*'+line.name.toLowerCase() && line.name.toLowerCase() != settings.nick().toLowerCase()){
								if(channels.getCurrent()!=='' && logMode!==true){
									tdName = ['(PM)',name];
									channels.openPm(line.name);
									notification.make('(PM) <'+line.name+'> '+line.message,line.chan);
								}else{
									addLine = false;
								}
							}else{
								tdName = name;
								line.type = 'message';
							}
							break;
						case 'pmaction':
							if(channels.getCurrent(true).toLowerCase() != '*'+line.name.toLowerCase() && line.name.toLowerCase() != settings.nick().toLowerCase()){
								if(channels.getCurrent()!=='' && logMode!==true){
									tdMessage = ['(PM)',name,' ',message];
									channels.openPm(line.name);
									notification.make('* (PM)'+line.name+' '+line.message,line.chan);
									line.type = 'pm';
								}else{
									addLine = false;
								}
							}else{
								tdMessage = [name,' ',message];
								line.type = 'action';
							}
							break;
						case 'highlight':
							if(line.name.toLowerCase() != 'new'){
								notification.make('('+line.chan+') <'+line.name+'> '+line.message,line.chan);
							}
							addLine = false;
							break;
						case 'internal':
							tdMessage = line.message;
							break;
						case 'server':
							break;
						default:
							addLine = false;
					}
					if(addLine){
						if(($mBox.find('tr').length>maxLines) && logMode!==true){
							$mBox.find('tr:first').remove();
						}
						
						if($('<span>').append(tdName).text() == '*'){
							statusTxt = $('<span>').append(tdName).text()+' ';
						}else{
							statusTxt = '<'+line.name+'> ';
						}
						if(options.get(10,'F')=='T'){
							statusTxt = '['+(new Date(line.time*1000)).toLocaleTimeString()+'] '+statusTxt;
						}
						statusTxt += $('<span>').append(tdMessage).text();
						statusBar.set(statusTxt);
						$mBox.append(
							$('<tr>')
								.css({
									width:'100%',
									height:1
								})
								.addClass((options.get(6,'T')=='T' && (lineHigh = !lineHigh)?'lineHigh':''))
								.addClass(((new Date(lastMessage)).getDay()!=(new Date(line.time*1000)).getDay())?'seperator':'') //new day indicator
								.append(
									(options.get(10,'F')=='T'?$('<td>')
										.addClass('irc-date')
										.append('['+(new Date(line.time*1000)).toLocaleTimeString()+']'):''),
									$('<td>')
										.addClass('name')
										.append(tdName),
									$('<td>')
										.addClass(line.type)
										.append(tdMessage)
								)
						).find('img').load(function(e){
							scroll.slide();
						});
						scroll.slide();
						
						lastMessage = line.time*1000;
					}
					return true;
				},
				setSmileys:function(s){
					smileys = s;
				},
				getSmileys:function(){
					return smileys;
				}
			};
		})();
	$(document).ready(function(){
		network.init();
		switch($('body').attr('page')){
			case 'options':
				settings.fetch(function(){
					page.changeLinks();
					$('#options').height($(window).height() - 75);
					$(window).resize(function(){
						if(!(navigator.userAgent.match(/(iPod|iPhone|iPad)/i) && navigator.userAgent.match(/AppleWebKit/i))){
							$('#options').height($(window).height() - 75);
						}
					});
					$('#options').append(options.getHTML());
				});
				break;
			case 'admin':
				admin.init();
				break;
			//case 'main': // no need, already caught by default.
			default:
				page.load();
		}
	});
})(jQuery);