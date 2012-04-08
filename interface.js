﻿var btnFunctions = [playClick, pauseClick, stopClick, prevClick, nextClick, fastClick];

function login(callback){
	logined = false;
	callScript(pathPref + 'f=login;login=' + curUser.login + ';passwd=' + curUser.passwd +';json=1;', function(data){
		if (data.status == 'ok')
			sid = data.sid;
		else{
			alert(data.message);
			return false;
		}
		if(curUser.jury){
			curUser.passwd = '';
			$('#password').prop('value', '');
			for (var i = 0; i < problems.length; ++i)
				$('#forJury' + i).show();
		}
		logined = true;
		callback();
		return true;
	});
}

function showNewUser(){
	$('#userListDiv').empty();
	$('#userListDiv').append('<p>Текущий пользователь:</p>');
	$('#userListDiv').append('<p>' + curUser.name +'</p>');
	$('#userListDiv').append('<button name="changeUser" id = "changeUser">Сменить пользователя</button>');
	$('#changeUser').button();
	$('#changeUser').click(changeUser);
}

function chooseUser(){
	logined = false;
	var user = $('#userListDiv > input:checked');
	name = user[0].defaultValue;
	for (var i = 0; i < users.length; ++i){
		if (name == users[i].name){
			curUser = users[i];
			if (curUser.jury) {
				$("#enterPassword").bind("dialogbeforeclose", function(event, ui) {
					if (logined)
						showNewUser();
					$("#enterPassword").bind("dialogbeforeclose", function(event, ui){});
				});
				$('#enterPassword').dialog('open') ;
			}
			else
				login(showNewUser);
			break;
		}
	}
}

function changeUser(){
	for (var i = 0; i < problems.length; ++i)
		$('#forJury' + i).hide();
	logined = false;
	callScript(pathPref +'f=logout;sid=' + sid + ';json=1;', function(){});
	sid = undefined;
	callScript(pathPref +'f=users;cid=' + cid + ';rows=100;json=1;', function(data){
		if (!data)
			return;
		curUser = new Object();
		users = [];
		for (var i = 0; i < data.length; ++i){
			if (data[i].ooc == 1)
				continue;
			users.push({'login': data[i].login, 'name': data[i].name, 'jury': data[i].jury, 'passwd': defaultPass}); 
		}
		$('#userListDiv').empty();
		if (users.length > 0){
			$('#userListDiv').append('<p>Выберите свое имя из списка</p>');
			for (var i = 0; i < users.length; ++i){
				$('#userListDiv').append(
				'<input type="radio" name="user_name" id="user_name_' + i + '" value="' + users[i].name + '" ' + 
				(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="user_name_' + i + '">' 
				+ users[i].name + '</label><br>');
			}
			$('#userListDiv').append('<br><button id = "userNameSubmit" >Выбрать пользователя</button>');
			$('#userNameSubmit').button({icons: {primary: 'ui-icon-check'}});
			$('#userNameSubmit').click(chooseUser);
		}
		else 
			$('#userListDiv').append('<p>На данный момент нет доступных пользователей</p>');	
	});
}

function submit(data, sep, l, submitStr){
	callScript(pathPref + 'f=contests;filter=json;sid=' + sid + ';json=1;', function(data){
		if (data.error == 'bad sid'){
			if (curUser.jury) {
				$("#enterPassword").bind("dialogbeforeclose", function(event, ui) {
					if (logined && confirm('Переотправить решение?'))
						submit(data, sep, l, submitStr);	
					$("#enterPassword").bind("dialogbeforeclose", function(event, ui){});
				});
				$('#enterPassword').dialog('title', 'sid устарел. Введите пароль снова');
				$('#enterPassword').dialog('open');
			}					
			else
				login(function() {submit(data, sep, l, submitStr)});
		} 
		else{
			if (atHome){
				callSubmit_('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid +';json=1;', submitStr, function(data){
					alert('Решение отослано на проверку');
				});  
			}
			else
			callSubmit(pathPref + 'f=problems;sid=' + sid + ';cid=' + cid+ ';json=1;', data,'imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' 
					+ sid + ';cid=' + cid, sep, l, function(data){
				alert('Решение отослано на проверку');
			});
		}
	})
}

submitClick = function(){
	if (!logined) {
		alert('Невозможно отослать решение, так как не выбран пользователь');
		return false;
	}		
	if (!sid)
		(curUser.jury) ? $('#enterPassword').dialog('open') : login();
	curProblem.submit();
}

function getContests(){
	/*callScript(pathPref + 'f=contests;filter=json;sort=1;sort_dir=0;json=1;', function(data){ ////
		if (!data)
			return;
		contests = data.contests;
		for (var i = 0; i < contests.length; ++i){
				$('#contestsList').append(
				'<input type="radio" name="contest_name" id="contest_name_' + i + '" value="' + contests[i].name + '" ' + 
				(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="contest_name_' + i + '">' 
				+ contests[i].name + '</label><br>');
		}
		cid = contests[0].id;
		document.title = contests[0].name;
	});*/
	fillTabs();
}

function clearTabs(){
	$('#tabs > div').each(function(index, elem){
		$(elem.id).empty();
		$('#tabs').tabs('remove', index);
	});
}

function changeContest(){
	var contest = $('#contestsList > input:checked');
	name = contest[0].defaultValue;
	document.title = name;
	for (var i = 0; i < contests.length; ++i){
		if (name == contests[i].name){
			if (cid != contests[i].id){
				cid = contests[i].id;
				fillTabs();
			}
			break;
		}
	}
}

function onAddWatchClick()
{
	$('#addWatchDialog').dialog('open');
}

function fillTabs(){
	if ($('#ui-tabs-0').length){
		$('#ui-tabs-0').empty();
		$('#tabs').tabs('remove', 0);
	}
	$('#tabs').tabs('add', '#ui-tabs-0', "Выбор пользователя", 0);
	$('#ui-tabs-0').append('<table width = "100%"><tr id = "tab0"><td><div id = "userListDiv"></div></td>');
	$('#tab0').append('<td valign = "top" align = "right"><button id = "changeContestBtn">Выбрать турнир</button></td></tr>');
	$('#ui-tabs-0').append('</table>');
	$('#changeContestBtn').button();
	$('#changeContestBtn').click(function(){
		$('#contestsList').show(); 
		$('#changeContest').dialog('open'); 
		return false; 
	}); 
	//changeUser();
	problems = [];
	//callScript(pathPref + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + cid + ';nokw=1;json=1', function(data){
		for (var i = 0; i < problemsData.length; ++i){
			problems[i] = new Problem(problemsData[i], i);
			if ($('#ui-tabs-' + (i + 1)).length){
				$('#ui-tabs-' + (i + 1)).empty();
				$('#tabs').tabs('remove', i + 1);
			}
			$('#tabs').tabs('add', '#ui-tabs-' + (i + 1),problems[i].title, i + 1);
			var divs = [];
			for (var j = 0; j < problems[i].commands.length; ++j)
			{
				divs.push({'tab': i, 'divclass': problems[i].commands[j], 'divname': cmdClassToName[problems[i].commands[j]]});
			}
			divs.push({'tab': i, 'divclass': 'if', 'divname': cmdClassToName['if']});
			divs.push({'tab': i, 'divclass': 'ifelse', 'divname': cmdClassToName['ifelse']});
			divs.push({'tab': i, 'divclass': 'while', 'divname': cmdClassToName['while']});
			divs.push({'tab': i, 'divclass': 'for', 'divname': cmdClassToName['for']});
			var buttons = [];
			for (var j = 0; j < btns.length; ++j)
			{
				buttons.push({'tab': i, 'btn': btns[j], 'title': btnTitles[j]});
			}
			$('#tabTemplate').tmpl({'tab': i, 
				'statement': problems[i].statement, 
				'maxCmdNum': problems[i].maxCmdNum,
				'maxStep': problems[i].maxStep,
				'commands': divs,
				'btns': buttons},{}).appendTo('#ui-tabs-' + (i + 1));
			$('#hideStatement' + i)
				.button({text: false, icons: {primary: 'ui-icon-minus'}})
				.click(function(j){
					return function(){
						if ($('#statement' + j).is(':visible'))
						{
							$('#statement' + j).hide();
							$(this).button( 'option', 'icons', {primary:'ui-icon-plus'});
						}
						else
						{
							$('#statement' + j).show();
							$(this).button( 'option', 'icons', {primary:'ui-icon-minus'});
						}
					}
				}(i));
			$('#progressBar' + i).progressbar({value: 0});
			$('#btn_clear' + i).button({text:false, icons: {primary: 'ui-icon-trash'}});
			$('#btn_clear' + i).click(clearClick);
			$('#submit' + i).button({icons: {primary: 'ui-icon-check'}});
			$('#submit' + i).click(submitClick);
			$('#tdcode' + i).hide();
			$('#addWatch' + i).hide();
			$('#watchTable' + i).hide();
			var CM = CodeMirror.fromTextArea($('#codearea' + i)[0], {
				lineNumbers: true,
				onGutterClick: function(cm, n) {
					var info = cm.lineInfo(n);
						if (info.markerText)
							cm.clearMarker(n);
						else
						cm.setMarker(n, "<span style=\"color: #900\">●</span> %N%");
				},
			    mode: {name: "python",
		           version: 2,
		           singleLineStringErrors: false},
		        indentUnit: 4,
		        tabMode: "shift",
		        matchBrackets: true
			});
			codeareas.push(CM);
			var groupBox = "input[name='group" + i + "']";
			$(groupBox).change(function(j){
				return function(){
					
				    if ($("input[name='group" + j + "']" + ":checked").prop('id') == 'commandsMode' + j)
			    	{
			    		$('#ulCommands' + j).show();
						$('#jstree-container' + j).show();
						$('#tdcode' + j).hide();
						$('#addWatch' + j).hide();
						$('#watchTable' + j).hide();
						$('#tdcommands' + j).show();
						$('#tdcontainer' + j).show();
						$('#jstree-container' + j).empty();
						//problems[j].cmdList = undefined;
						problems[j].prepareForExecuting();
						convertTreeToCommands(finalcode[j].compiled.ast.body, undefined, problems[j]).generateCommand(
							jQuery.jstree._reference('#jstree-container' + j) );
						++cmdId;
						problems[j].updated();
			    	}
				    else
			    	{
			    		$('#ulCommands' + j).hide();
						$('#jstree-container' + j).hide();
						$('#tdcommands' + j).hide();
						$('#tdcontainer' + j).hide();
						$('#tdcode' + j).show();
						problems[j].setDefault();
						codeareas[j].setValue(problems[j].convertCommandsToCode());
						codeareas[j].refresh();
						$('#addWatch' + j).show();
						$('#watchTable' + j).show();

			    	}
				}
			}(i));
			problems[i].fillLabyrinth();
			$('#forJury' + i).hide();
			for (var j = 0; j < btns.length; ++j){
				$('#btn_'+ btns[j] + i).button({text: false, icons: {primary: buttonIconClasses[j]}});
				$('#btn_'+ btns[j] + i).bind('click', function() {
					curProblem.hideFocus();
					eval( $(this).prop('name') + 'Click()'); 		
					return false;
				});
			}
			$('#addWatch' + i)
				.button()
				.click(function(j)
				{
					return function()
					{
						$('#addWatchDialog').dialog('open');
					}
				}(i));
			lastWatchedIndex.push(0);
			watchList.push({});
		}
		
	//});
	if ($('#ui-tabs-' + (problems.length + 1)).length){
		$('#ui-tabs-' + (problems.length + 1)).empty();
		$('#tabs').tabs('remove', (problems.length + 1));
	}
	$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 1), 'Результаты', (problems.length + 1));
	$('#ui-tabs-' + (problems.length + 1)).append('<button id = "refreshTable">Обновить таблицу</button>');
	$('#refreshTable').button({text:false, icons: {primary: 'ui-icon-refresh'}});
	$('#ui-tabs-' + (problems.length + 1)).append('<table class = "results"><tr><td>' + 
		'<iframe id = "results" src = "' + resultsUrl + cid + ';" class = "results"></iframe></td></tr></table>');
	$('#refreshTable').click(function() {$('#results').prop('src', resultsUrl + cid)});
		$('#tabs').tabs('select', 0);
	for(var i = $('#tabs').tabs('length') - 1; i > problems.length + 1; --i){
	  while($('#ui-tabs-' + i).length){
			$('#ui-tabs-' + i).empty();
			$('#tabs').tabs('remove', i);
		}
	}
	$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 2), 'test code mirror', (problems.length + 2));
	$('#ui-tabs-' + (problems.length + 2)).append('<div id = "pythonForm"></div>');
	$('#pythonForm').append('<textarea id = "code" name = "code"></textarea>');
	$('#pythonForm').append('<select id = "selectTest" name = "selectTest" onchange = "testChanged()"></select>');
	for(var i = 0; i < TESTS_NUM; i++)
	{
		$('#selectTest').append('<option id = "test' + i + '" value = "' + i + '">' + (i + 1) + '</option>');
	}
	$('#code').append(tests[0]);
	codeareas[problems.length + 1] = CodeMirror.fromTextArea($('#code')[0], {
		lineNumbers: true,
		onGutterClick: function(cm, n) {
			var info = cm.lineInfo(n);
				if (info.markerText)
					cm.clearMarker(n);
				else
				cm.setMarker(n, "<span style=\"color: #900\">●</span> %N%");
		},
	    mode: {name: "python",
           version: 2,
           singleLineStringErrors: false},
        indentUnit: 4,
        tabMode: "shift",
        matchBrackets: true
	});
	$('#ui-tabs-' + (problems.length + 2)).append('<button id = "btnPython">Post python code</button>');
	$('#ui-tabs-' + (problems.length + 2)).append('<button id = "btnPythonNext">next</button>');
	$('#ui-tabs-' + (problems.length + 2)).append('<button id = "addWatch' + (problems.length + 1) + '">Add watch</button>');
	$('#pythonForm').append('<pre id = "cons' + (problems.length + 1) + '"></pre>');
	$('#pythonForm').append('<input type = "checkbox" onchange = "showHideCode()" id = "showHide">Show/hide code</input>');
	$('#pythonForm').append('<pre id = "codeRes1"></pre>');
	$('#pythonForm').append('<div id = "watchDiv"><table id = "watchTable' + (problems.length + 1) + '"></table></div>');
	$('#addWatch' + (problems.length + 1)).button().click(onAddWatchClick);
	$('#btnPython').button();
	$('#btnPython').click(tryCode);
	//$('#btnPythonNext').button();
	//$('#btnPythonNext').click(problems);
}

function setSpin(problem){
	$('#spinDiv' + cmdId).append('<input id = "spinCnt' + cmdId + '" class = "spinCnt" type="text">')
	$('#spin' + cmdId++).spin({
		min: 1,
		changed: function(p){
			return function(){
				p.updated();	
			}
		}(problem)
	});
}

function onCreateItem(tree, newNode, initObject, problem){
	var type = initObject.attr('rel');
	tree.set_type(type, newNode);
	tree.rename_node(newNode, cmdClassToName[type]);
	switch(type){
		case 'left':
		case 'right':
		case 'forward':
		case 'wait':
		case 'for':
			$(newNode).append('<span align = "right" id = "spinDiv' + cmdId + '" class = "cnt"></span>');
			$('#spinDiv' + cmdId).append('<input class = "cnt"  id="spin' + cmdId + '" value="1" type="text"/>');
			break;
		case 'if':
		case 'ifelse':
		case 'while':
			$(newNode).append('<select id = "select' + cmdId +'">');
			var options = ['wall at the left', 'wall at the right'];
			for (var i = 0; i < options.length; ++i)
			{
				$('#select' + cmdId).append('<option value = ' + i + '>' + options[i] + '</option><br>');
			}
			$(newNode).append('</select>');
			$('#select' + cmdId).change(function(p){return function() {p.updated();}}(problem));
			if (type == 'ifelse'){
				tree.rename_node(newNode, 'If');
				$("#jstree-container" + problem.tabIndex).jstree("create", $(newNode), "after", false, 
					function(elseNode){
					tree.set_type('else', elseNode);
					tree.rename_node(elseNode, 'Else');
						$(elseNode).prop('numId', cmdId);
						$(elseNode).prop('ifLi', 1);
						$(elseNode).prop('type', 'else');
						$(elseNode).addClass('else');
						$(elseNode).prop('id', 'else' + cmdId);
				}, true); 
			}
			break;
	}
	$(newNode).prop('numId', cmdId);
	$(newNode).prop('ifLi', 1);
	$(newNode).prop('type', type);
	$(newNode).addClass(type);
	$(newNode).prop('id', type + cmdId);
	setSpin(problem);
	problem.updated();
}
function isBlock(type){
	return type == false || type == 'block' || type == 'if' || type == 'ifelse' || 
		type == 'while' || type == 'for' || type == 'else';
}

function onFinishExecuting(problem)
{
	/*finalcode[problem] = undefined;
	$scope[problem] = undefined,
	$gbl[problem] = undefined,
	$loc[problem] = $gbl[problem];
	nextline[problem] = undefined;
	for (var i = 0; i < codeareas[problem].lineCount(); ++i)
		codeareas[problem].setLineClass(i, null);
	updateWatchList();*/
}

function playClick(){
	var problem = curProblem;
	problem.callPlay(300);
	$('#btn_play'+ problem.tabIndex).addClass('ui-state-focus');
}

function fastClick(){
	var problem = curProblem;
	problem.cmdHighlightOff();
	problem.callPlay(0);
}

function clearClick(){
	var problem = curProblem;
	if (!confirm('Вы уверены, что хотите очистить список команд?'))
		return;
	problem.setDefault();
	$('#jstree-container' + problem.tabIndex).children().remove();
}

function stopClick(){
	curProblem.stop();
}

function pauseClick(){
	curProblem.pause();
}

function nextClick(){
	curProblem.next();
}

function prevClick(){
	curProblem.prev();
}
