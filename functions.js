﻿function callScript(url, callback){
	if (atHome){
		$.ajax({
			async: false,
			dataType : 'json',
			url: 'script.php',
			data: 'url='+ url,
			success: function(data) {
				callback(data);
			},
			error: function(r, err1, err2){
				alert(err1 + ' ' + err2);
			}  
		});
	} 
	else{
		$.ajax({
			async: false,
			dataType : 'json',
			url: url,
			success: function(data) {
				callback(data);
			}
		});
	}
}

function callSubmit_(serv, path, submitData, callback){
	if (!atHome)
		return;
	$.ajax({  
		async: false,
		url: 'submit.php',
		type: 'POST',
		data: 'serv='+ serv + '&' + 'path=' + path + '&' + submitData,  
		success: function(html){  
			callback(html);
		}  
	});  
}

function callSubmit(url, submitData, path, serv, sep, l, callback){
	if (atHome)
		return;
	$.ajax({  
		async: false,
		url: url,
		type: 'POST',
		contentType: 'multipart/form-data',
		data: submitData,
		beforeSend: function(xhr){
			xhr.setRequestHeader('Host', serv);
			xhr.setRequestHeader('Connection', 'keep-alive');
			xhr.setRequestHeader('Referer', url);
			return true;
		},  
		success: function(html){  
			callback(html);
		},
		error: function(r, err1, err2){
			alert(err1 + " " + err2);
		}  
	}); 
}

function getProblemStatement(i){
	$.ajax({
		async: false,
		dataType : "json",
		url: 'problems/' + (i + 1) + '/problem.json',
		success: function(data) {
			if (!data)
				return;
			problems[i] = data;
		},
		error: function(r, err1, err2){
			alert(r.responseText);
		}
	});
}

function getTest(l, k){
	$.ajax({
		async: false,
		dataType : "json",
		url: 'problems/' + (l  + 1) + '/Tests/' + k +'.json',
		success: function(data) {
			if (!data)
				return;
			mapFromTest[l] = [];
			mapFromTest[l] = data.map.slice();
			curMap[l] = [];
			boxId[l] = 0;
			monsterId[l] = 0;
			prizeId[l] = 0;
			cellId[l] = 0;
			boxes[l] = [];
			monsters[l] = [];
			numOfPrizes[l] = 0;
			var t1 = data.spec_symbols;
			var t2 = data.moving_elements;
			var t3 = data.cleaner;
			var t4 = data.cleaned;
			var obj = undefined;
			for (var i = 0; i < mapFromTest[l].length; ++i){
				curMap[l][i] = [];
				for (var j = 0; j < mapFromTest[l][i].length; ++j){
					curMap[l][i][j] = [];
					var c = new Coord(j, i);
					curMap[l][i][j] = new FieldElem(l, c, mapFromTest[l][i][j] == "#")
					if (mapFromTest[l][i][j] == "R" || mapFromTest[l][i][j] == "U" || 
						mapFromTest[l][i][j] == "D" || mapFromTest[l][i][j] == "L" ){
						arrow[l] = new Arrow(l, c, mapFromTest[l][i][j]);
						obj = arrow[l];
						curDir[l] = startDir[l] = dirs[mapFromTest[l][i][j]];
						curX[l] = startX[l] = j;
						curY[l] = startY[l] = i;
					}
					for (var k = 0; k < t1.length; ++k)
					if (t1[k].symbol == mapFromTest[l][i][j]){
						obj = t1[k]["do"] == "eat" ? 
							new Prize(l, c, t1[k].style, t1[k].symbol, t1[k].zIndex ? t1[k].zIndex : 1, t1[k].points, 
										t1[k].d_life, t1[k].name) : 
							new Box(l, c, t1[k].style, t1[k].symbol, t1[k].zIndex ? t1[k].zIndex : 2, t1[k].points, 
										t1[k].d_life, t1[k].name);
						if (obj.__self == Prize)
							++numOfPrizes[l];
						else
							boxes[l].push({'id': boxId[l], 'x': j, 'y': i});
						break;
					}
					if (obj)
						curMap[l][i][j].pushCell(obj);
					obj = undefined;
				}
			}
			for (var k = 0; k < t2.length; ++k){
				var c = new Coord(t2[k].path[0].x, t2[k].path[0].y);
				obj = new Monster(l, c, t2[k].style, "", t2[k].zIndex ? t2[k].zIndex : 3, t2[k].points, t2[k].d_life, t2[k].path, 
								t2[k].looped, t2[k].die);
				curMap[l][c.y][c.x].pushCell(obj);
				monsters[l].push({'x': c.x, 'y': c.y});
			}
			for (var k = 0; k < t3.length; ++k){
				var c = new Coord(t3[k].x, t3[k].y);
				obj = new Key(l, c, t4[k]);
				curMap[l][c.y][c.x].pushCell(obj);
				for (var j = 0; j < t4[k].length; ++j){
					var c1 = new Coord(t4[k][j].x, t4[k][j].y);
					obj = new Lock(l, c1);
					curMap[l][c1.y][c1.x].pushCell(obj);
				}
			}
			curNumOfPrizes[l] = 0;
		},
		error: function(r, err1, err2){
			alert(r.responseText);
		}
	});
}

function commandsToJSON(){
	var list = $('#sortable' + curProblem).children();
	var arr = new Array();
	while (list.length){
		var dir;
		var obj = new Object();
		for (var i = 0; i < classes.length / 2; ++i)
			if (list.first().hasClass(classes[i]) || list.first().hasClass(classes[i] + 1)){
				obj.dir = classes[i];
				break;
			}
		obj.cnt = $('#spin' + list.first().attr('numId')).attr('value');
		arr.push(obj);
		list = list.next();
	}
	return $.toJSON(arr);
}

function exportCommands(){
	$('#export' + curProblem).html(commandsToJSON());
	$('#export' + curProblem).dialog('open');
	return false;
}

function changeClass(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = ['forward', 'right', 'left', 'wait'];
	for (var k = 0; k < divs.length; ++k){
		if (elem.hasClass(divs[k])){
			elem.removeClass(divs[k]);
			elem.addClass(divs[k] + 1);
		}   
		else if (elem.hasClass(divs[k] + 1)){
			elem.removeClass(divs[k] + 1);
			elem.addClass(divs[k]);
		}
	}
}

function isChangedClass(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = ['forward', 'right', 'left', 'wait'];
	for (var k = 0; k < divs.length; ++k)
		if (elem.hasClass(divs[k] + 1))
			return true;
	return false;
}

function clearClasses(){
	var el = $('#sortable' + curProblem).children();
	l = el.length;
	for (var i = 0; i < l; ++i){
		if (isChangedClass(el.attr('id')))
			changeClass(el.attr('id'));
		el = el.next();
	}
}

function setCounters(j, dontReload){
	var el = $('#sortable' + curProblem).children();
	while(j){
		el = el.next();
		j--;
	}
	while (el.length > 0){
		var numId = el.attr('numId');
		var val =  $('#spin' + numId).attr('value');
		var newVal = dontReload ? $('#spinCnt' + numId).attr('cnt') : val;
		$('#spinCnt' + numId).attr('cnt', newVal);
		$('#spinCnt' + numId).attr('value', newVal + '/' + val);
		el = el.next();
	}
}

function divI(){ return curState[curProblem].divIndex; }

function divN(){ return curState[curProblem].divName;}

function cmd(){ return curState[curProblem].cmdIndex;}

function step(){ return curState[curProblem].step; }

function list() {return curCmdList[curProblem]; }

function updated(){
	var arr = $('#sortable' + curProblem).sortable('toArray');
	var needToClear = false;
	var j = curCmdList[curProblem].length;  //number of first cmd that counters must be changed
	if(!curCmdList[curProblem].length)
		needToClear = true;
	for (var i = 0; i < arr.length; ++i){
		var c = parseInt($('#' + arr[i] + ' input')[0].value); //current counter
		if (!curCmdList[curProblem][i])
			curCmdList[curProblem][i] = new Object();
		if (curCmdList[curProblem][i].name != arr[i] || 
			(curCmdList[curProblem][i].name == arr[i] && curCmdList[curProblem][i].cnt != c)){ //if command was changed
			if (i < divI()){   
				if (cmdListEnded[curProblem] && (i == divI() - 1) && 
					(curCmdList[curProblem][i].name == arr[i] && curCmdList[curProblem][i].cnt < c)){ //after axecuting all 
					with(curState[curProblem]){                   //of commands the counter of the last command was increased
						divIndex = i;
						cmdIndex = c - 1;
						divName = arr[i];
					}
					var numId = $('#' + arr[i]).attr('numId');
					$('#spinCnt' + numId).attr('cnt', c - curCmdList[curProblem][i].cnt);
					$('#spinCnt' + numId).attr('value', 
							$('#spinCnt' + numId).attr('cnt') + '/' + $('#spin' + numId).attr('value'));
				}
				else{
					needToClear = true;
					j = 0;
				}
			}
			else
				if (i == divI()){     //parameters of last executed cmd were changed
					if (curCmdList[curProblem][i].name == arr[i]){   //if counter was changed
						if (curCmdList[curProblem][i].cnt > c)
							needToClear = true;
						else{   //change the value of counter
							var numId = $('#' + arr[i]).attr('numId');
							$('#spinCnt' + numId).attr('cnt', parseInt($('#spinCnt' + numId).attr('cnt')) + 1);
							$('#spinCnt' + numId).attr('value', 
								$('#spinCnt' + numId).attr('cnt') + '/' + $('#spin' + numId).attr('value'));	
						} 
					}
					else	
						j = i;
			}
			curCmdList[curProblem][i].name = arr[i];
			curCmdList[curProblem][i].cnt = c;
		}
	}
	cmdListEnded[curProblem] = false;
	if (i < curCmdList[curProblem].length)
		curCmdList[curProblem].splice(i, curCmdList[curProblem].length - i);
	if (needToClear){
		setDefault();
		clearClasses();
	}
	if (divI() < list().length)
		curState[curProblem].divName = list()[divI()].name;
	showCounters();
	setCounters(j);
}

function highlightOn(t){
	for (var i = 0; i < curMap[t].length; ++i)
		curMap[t][i][arrow[t].coord.x].highlightOn();
	for (var i = 0; i < curMap[t][0].length; ++i)
		curMap[t][arrow[t].coord.y][i].highlightOn();
}

function highlightOff(t, func){
	for (var i = 0; i < curMap[t].length; ++i)
		curMap[t][i][arrow[t].coord.x].highlightOff();
	for (var i = 0; i < curMap[t][0].length; ++i)
		curMap[t][arrow[t].coord.y][i].highlightOff();
}

function setDefault(f){
	var t = curProblem;
	enableButtons();
	dead[t] = false;
	for (var i = 0; i < curMap[t].length; ++i)
		for (var j = 0; j < curMap[t][i].length; ++j){
			s = '#' + (t * 10000 + i * 100 + j);
			$(s).empty();
			curMap[t][i][j].setDefault();
		}
	for (var i = 0; i < curMap[t].length; ++i)
		for (var j = 0; j < curMap[t][i].length; ++j){
			var arr = curMap[t][i][j].changedCells();
			for (var k = 0; k < arr.length; ++k){
				curMap[t][arr[k].coord.y][arr[k].coord.x].pushCell(arr[k]);
				switch(arr[k].__self){
					case Arrow: 
						arrow[t] = arr[k];
						break;
					case Monster:
						monsters[t][arr[k].id] = arr[k];
						monsters[t][arr[k].id].x = arr[k].coord.x;
						monsters[t][arr[k].id].y = arr[k].coord.y;
						break;
					case Box:
						boxes[t][arr[k].id] = arr[k];
						break;
					}
			}
		}
	highlightOn(t);
	for (var i = 0; i < curMap[t].length; ++i)
		for (var j = 0; j < curMap[t][i].length; ++j)
			curMap[t][i][j].draw();
	pause[t] = false;
	$("#cons" + t).empty();
	curDir[t] = startDir[t];
	curX[t] = startX[t];
	curY[t] = startY[t];
	clearClasses();
	stopped[t] = false;
	pnts[t] = 0;
	cmdListEnded[t] = false;
	curNumOfPrizes[l] = 0;
	if ($("#curStep" + t)){
		$("#curStep" + t).attr('value', 0);
		$('#progressBar'  + t).progressbar('option', 'value',  0);
	}
	curState[t] = {'cmdIndex': 0, 'divIndex': 0, 'step': 0, 'divName': curCmdList[t][0].name};
	var el = $('#sortable' + t).children();
	while (el.length > 0){
		$('#spinCnt' + el.attr('numId')).attr('cnt', $('#spin' + el.attr('numId')).attr('value'));
		el = el.next();
	}
}

function prevDivName(){
	if (curState[curProblem].divIndex < 1)
		return false;
	return curCmdList[curProblem][curState[curProblem].divIndex - 1].name;
}

function loop(cnt, i){
	var newCmd = false;
	if (!i)
		i = 0;
	if (dead[curProblem] || !playing[curProblem])
		return;
	if (pause[curProblem] || stopped[curProblem]){
		if (pause[curProblem])
			pause[curProblem] = false;
		else{
			setDefault();
		}
		return;
	}
	var t = prevDivName();
	if (speed[curProblem] != 0 && cmd() == 0 && t && isChangedClass(t))
		changeClass(t);
	newCmd = cmd() == 0;
	var x = curX[curProblem];
	var y = curY[curProblem];
	t = divN().replace(/\d{1,}/, "")
	dx[curProblem] = changeDir[t][curDir[curProblem]].dx;
	dy[curProblem] = changeDir[t][curDir[curProblem]].dy;
	curDir[curProblem] = changeDir[t][curDir[curProblem]].curDir;
	var checked = checkCell(step(), cnt);
	if (divN()){
		var numId = $('#'+ divN()).attr('numId');
		var newCnt = $('#spinCnt' + numId).attr('cnt') - 1;
		$('#spinCnt' + numId).attr('cnt', newCnt);
	}
	if (!speed[curProblem] || (i >= cnt))
		return nextStep(cnt, ++i);
	if (newCmd || cmd() == 0)
		changeClass(divN());
	if (divN()){
		$('#spinCnt' + numId).attr('value', newCnt + '/' + $('#spin' + numId).attr('value'));
	}
	if (dead[curProblem])
		return;
	setTimeout(function() { nextStep(cnt, ++i); }, speed[curProblem]);	
}

function nextCmd(){
	var t = curProblem;
	if ((divI() == list().length - 1 && cmd() == list()[divI()].cnt - 1)){
		curState[t] = {'divIndex': list().length, 'cmdIndex': 0, 'step': curState[t].step + 1};
		cmdListEnded[t] = true;
		return false;
	}
	else
	if (divI() >= list().length)
		return false;
	if (cmd() == list()[divI()].cnt - 1)
		with(curState[t]){
			cmdIndex = 0;
			divName =  curCmdList[t][++divIndex].name;
		}
	else 
		++curState[t].cmdIndex;
	$('#curStep' + t).attr('value', ++curState[t].step + 1);
	$('#progressBar'  + t).progressbar('option', 'value',  (curState[t].step + 1) / problems[t].max_step * 100);
	if (curState[t].step == problems[t].max_step){
		$('#cons' + t).append('Превышен лимит затраченных шагов');
		dead[t] = true;
	}
	return true;
}

function nextStep(cnt, i){
	if (dead[curProblem] || stopped[curProblem])
		return;
	if ( playing[curProblem] && nextCmd() && !pause[curProblem] && !stopped[curProblem] && (!cnt || i < cnt))
		loop(cnt, i);
	else {
		playing[curProblem] = false;
		enableButtons();
		if (!speed[curProblem]){
			speed[curProblem] = 300;
			setCounters(0, true);
			var lastCmd = (divI() >= list().length) ? 
				$('#sortable' + curProblem + ' > li:last').attr('id') : divN();
			if (!isChangedClass(lastCmd))
				changeClass(lastCmd);
		}	
	}
}

function play(cnt){
	if (dead[curProblem])
		return;
	playing[curProblem] = true;
	if (!divN())
		curState[curProblem].divName = list()[0].name;
	if ((divI() == list().length - 1 && cmd() == list()[divI()].cnt) || (divI() >= list().length)){
		setDefault();
		setCounters();
	}
	loop(cnt);
}