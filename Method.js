var Method = Method || ( function () {
	return {
		DRAG_MOVE_EVENT: "drag_move_event",
		RELOAD_FINISH_EVENT: "reload_finish_event",

		//**设置样式
		setStyle: function ( elem, styleObj ) {
			for ( var str in styleObj ) {
				elem.style[ str ] = styleObj[ str ];
			}
		},

		//**创建标签元素并插入到父元素中
		createElem: function ( type, parent, styleObj ) {
			var elem = document.createElement( type );
			if ( parent ) {
				parent.appendChild( elem );
			}
			if ( styleObj ) {
				Method.setStyle( elem, styleObj );
			}
			return elem;
		},

		//**随机颜色（带透明度）
		randomColor: function ( alpha ) {
			var arr = [];
			var color;
			for ( var i = 0; i < 3; i++ ) {
				arr.push( Math.floor( Math.random() * 256 ) );
			}
			if ( alpha ) {
				arr.push( alpha );
				color = `rgba(${ arr.join( ',' ) })`;
			} else {
				color = `rgb(${ arr.join( ',' ) })`;
			}
			return color;
		},

		//**随机颜色（不带透明度）
		getRandomColor: function () {
			var arr = [];
			for ( var i = 0; i < 3; i++ ) {
				arr.push( Math.floor( Math.random() * 256 ) );
			}
			return `rgb(${ arr.join( ',' ) })`;
		},

		//**拖拽
		dragElem: function ( elem ) {
			elem.addEventListener( "mousedown", this.mouseHandler );

		},
		cancelDrag: function ( elem ) {
			elem.removeEventListener( "mousedown", this.mouseHandler );
		},
		mouseHandler: function ( e ) {
			if ( e.type === "mousedown" ) {
				e.stopPropagation();
				e.preventDefault();
				document.addEventListener( "mousemove", Method.mouseHandler );
				document.offsetPoint = {
					x: e.offsetX,
					y: e.offsetY
				};
				document.dragTarget = this;
				var rect = this.getBoundingClientRect();
				document.prentRect = {
					left: rect.left - this.offsetLeft,
					top: rect.top - this.offsetTop
				};
				this.addEventListener( "mouseup", Method.mouseHandler );
			} else if ( e.type === "mousemove" ) {
				this.dragTarget.style.left = e.pageX - this.prentRect.left - this.offsetPoint.x + "px";
				this.dragTarget.style.top = e.pageY - this.prentRect.top - this.offsetPoint.y + "px";
				var evt = new Event( Method.DRAG_MOVE_EVENT );
				this.dragTarget.dispatchEvent( evt );
			} else if ( e.type === "mouseup" ) {
				document.removeEventListener( "mousemove", Method.mouseHandler );
				this.removeEventListener( "mouseup", Method.mouseHandler );
			}
		},

		//**碰撞检测
		hitTest: function ( elem1, elem2 ) {
			var elemRect1 = elem1.getBoundingClientRect();
			var elemRect2 = elem2.getBoundingClientRect();

			if ( elemRect1.left > elemRect2.left && elemRect1.left < elemRect2.left + elemRect2.width && elemRect1.top >
				elemRect2.top && elemRect1.top < elemRect2.top + elemRect2.height ) {
				return true;
			}
			if ( elemRect1.left + elemRect1.width > elemRect2.left && elemRect1.left + elemRect1.width < elemRect2.left +
				elemRect2.width && elemRect1.top > elemRect2.top && elemRect1.top < elemRect2.top + elemRect2.height ) {
				return true;
			}
			if ( elemRect1.left > elemRect2.left && elemRect1.left < elemRect2.left + elemRect2.width && elemRect1.top +
				elemRect1.height > elemRect2.top && elemRect1.top + elemRect1.height < elemRect2.top + elemRect2.height ) {
				return true;
			}
			if ( elemRect1.left + elemRect1.width > elemRect2.left && elemRect1.left + elemRect1.width < elemRect2.left +
				elemRect2.width && elemRect1.top + elemRect1.height > elemRect2.top && elemRect1.top + elemRect1.height <
				elemRect2.top + elemRect2.height ) {
				return true;
			}
			return false;
		},

		//**缓动效果
		TweenLite: function ( elem, targetObj, easing, time, updateCallBack, completeCB ) {
			var color = getComputedStyle( elem ).backgroundColor.split( "(" )[ 1 ].split( ")" )[ 0 ].split( "," );
			var r = parseInt( color[ 0 ] );
			var g = parseInt( color[ 1 ] );
			var b = parseInt( color[ 2 ] );
			var startObj = {
				left: elem.offsetLeft,
				top: elem.offsetTop,
				width: elem.offsetWidth,
				height: elem.offsetHeight,
				bgR: r,
				bgG: g,
				bgB: b,
				borderRadius: parseInt( getComputedStyle( elem ).borderRadius )
			};
			var tween = new TWEEN.Tween( startObj );
			tween.to( targetObj, time );
			tween.easing( easing );
			tween.onUpdate( updateCallBack );
			if ( completeCB ) {
				tween.onComplete( completeCB );
			}
			tween.start();
		},

		//**预加载
		/*
		 *  预加载方法
		 *  参数
		 *      list  Array 图片名称的数组
		 *      path  String  图片名称前面的路径字符串
		 *      callBack  Function   回调函数，用于当加载图片完毕后，通过执行这个回调函数
		 *                   将加载完成图片字典传回原代码中
		 *               callBack函数在源代码中定义时，必须有一个参数，这个参数是对象，就是
		 *               这里加载完成的图片字典
		 *
		 * */
		reload: function ( list, path, callBack ) {
			//新建一个图片
			var img = new Image();
			//将list,path,callBack这三个参数存储在img的三个属性上
			//在loadHandler这个事件函数中，我们一直都是使用这一个img，
			// 因此loadHandler函数中this就是这个img，那么里面this.list就是这里存储的list
			img.list = list;
			img.path = path;
			img.callBack = callBack;
			//这里增加一个imgDic的属性是一个对象，用于存储以后加载进入的所有图片
			img.imgDic = {};
			//用来计数当前的加载进入的图片是第几个
			img.num = 0;
			//增加侦听事件
			img.addEventListener( "load", Method.loadHandler );
			//指定图片的加载路径和图片名称
			img.src = path + list[ 0 ];
		},
		loadHandler: function ( e ) {
			//这是分解图片地址中的图片名称，这个图片名称不要后缀
			/*var startIndex=this.src.lastIndexOf("/")+1;
			var endIndex=this.src.lastIndexOf(".");
			var name=this.src.slice(startIndex,endIndex);*/
			//this.imgDic就是上面定义的img.imgDic是个对象，现在给它里面添加属性
			//属性名就是上面的name（我们把上面的所有代码合起来写的）,属性的值就是当前图片的克隆元素
			this.imgDic[ this.src.slice( this.src.lastIndexOf( "/" ) + 1, this.src.lastIndexOf( "." ) ) ] = this.cloneNode( false );
			//当前加载第几张图片
			this.num++;
			//如果当前加载的图片大于需要加载图片数组列表的长度时，就加载完成了
			if ( this.num > this.list.length - 1 ) {
				//如果我们使用callBack参数
				if ( this.callBack ) {
					//调用callBack参数，并且将图片字典通过参数传递会那个回调函数
					this.callBack( this.imgDic );
					//返回不再执行后面
					return;
				}
				//创建一个事件
				var evt = new Event( Method.RELOAD_FINISH_EVENT );
				//并且给这个事件对象增加一个属性imgDic就是这个图片字典
				evt.imgDic = this.imgDic;
				//给document抛发这个事件
				document.dispatchEvent( evt );
				return;
			}
			//更改地址，加载下一张图片
			this.src = this.path + this.list[ this.num ];
		},
		//**原生ajax封装，包括jsonp跨域请求
		ajax: function ( opts ) {
			opts = opts || {}; //接收传入的参数，没传则为空对象
			if ( !opts.url ) return; //没有请求地址，直接阻断执行
			//设置默认值
			let type = ( opts.type || 'GET' ).toLowerCase(),
				async = opts.async || true, //是否异步
				dataType = opts.dataType || 'json', //响应数据类型
				jsonp = opts.jsonp || 'callback',
				data = opts.data || {},
				params = formatParams( data );
			//创建XHR对象，判断浏览器是否支持XMLHttpRequest
			let XHR;
			window.XMLHttpRequest ?
				XHR = new XMLHttpRequest() :
				XHR = new ActiveXObject( 'Microsoft.XMLHTTP' );
			switch ( type ) {
				case 'get':
					XHR.open( 'get', opts.url + "?" + params, async );
					XHR.send( null );
					break;
				case 'post':
					XHR.open( 'post', opts.url, async );
					XHR.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' ); // 设置请求头
					XHR.send( params );
					break;
				case 'jsonp':
					//创建一个有名的全局函数
					let fnName = 'jsonp_' + ( new Date().getTime() );
					fnName = fnName.replace( '.', '' ); //函数名不能有点，所以用空字符 替换点
					data[ jsonp ] = fnName; // 把fnName插入到data传递的参数里面
					let script = document.createElement( 'script' );
					script.src = opts.url + '?' + params; // 发送请求，然后这个全局函数被调用window[fnName]
					document.body.appendChild( script );
					// 在全局函数（ window[fnName]）里面接收实参
					window[ fnName ] = function ( json ) {
						opts.success && opts.success( json );
						window[ fnName ] = null;
						// script是用来发送请求的，当请求完毕，使script为null
						document.body.removeChild( script );
					};
					break;
			}
			//响应请求
			XHR.onreadystatechange = function () {
				if ( XHR.readyState === 4 ) {
					if ( !/^2\d{2}$/.test( "XHR.status" ) ) {
						opts.error && opts.error( XHR.status )
					} else {
						dataType === 'json' ?
							opts.success && opts.success( JSON.parse( XHR.responseText ) ) :
							opts.success && opts.success( XHR.responseText );
					}
				}
			}
		},
		//格式化参数 以username=admin&password=123的形式返回
		formatParams: function ( data ) {
			//设置时间戳,避免缓存
			data.t = new Date().getTime();
			let arr = [];
			for ( let key in data ) {
				arr.push( key + '=' + data[ 'key' ] );
			}
			return arr.join( '&' );
		},
		//**原生ajax封装，包含jsonp跨域请求
		getAjaxData: function ( jsonObj ) {
			var arr = [];
			for ( var key in jsonObj ) {
				arr.push( key + "=" + jsonObj[ "key" ] );
			}
			var urlData = arr.join( "&" );
			return urlData;
		},
		createHttp: function ( url, type, data, success, error ) {
			var data = this.getAjaxData( data );
			var xhr = new XMLHttpRequest || new ActiveXObject( "Microsoft.XMLHttp" );
			if ( type == "GET" ) {
				xhr.open( type, url + "?" + data, true );
				xhr.send();
			}
			eles
			if ( type == "POST" ) {
				xhr.open( type, url, true );
				xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
				xhr.send( data );
			}
		},
		get: function ( url, data, success, error ) {
			this.createHttp( url, "GET", data, success, error );
		},
		post: function ( url, data, success, error ) {
			this.createHttp( url, "POST", data, success, error );
		},
		jsonp: function ( url, data, success, error ) {
			var data = this.getAjaxData( data );
			var script = document.createElement( 'script' );
			var callbackName = "cb" + ( new Date().getTime() ); //保证每次请求的函数名不重复
			callbackName = callback || callbackName.replace( ".", "" ); //因为函数名不能有点，所以用空替换点
			window[ "callbackName" ] = function ( data ) {
				success( data );
				window[ "callbackName" ] = null;
				document.body.removeChild( script );
			};
			script.src = url + "?" + data + "&callback=" + callbackName;
			document.body.appendChild( script );
		},

		// **角度转弧度函数
		DTR: function ( deg ) {
			return Math.PI / 180 * deg;
		},

		// **求两个数之间的随机数
		getRandomNum: function ( min, max ) {
			return Math.round( Math.random() * ( max - min ) + min )
		},
		// **数组去重（原生）
		removeD: function ( arr ) {
			var new_arr = [];
			for ( var i = 0; i < arr.length; i++ ) {
				if ( new_arr.indexOf( arr[ i ] ) === -1 ) {
					new_arr.push( arr[ i ] );
				}
			}
			arr.length = 0;
			arr = new_arr.concat();
			new_arr = null;
			return arr;
		},
		//**统计数组元素重复次数。
		multiple: function ( arr ) {
			var obj = {};
			for ( var m = 0; m < arr.length; m++ ) {
				var str = arr[ m ]; //将数组元素赋值给变量str
				//此时str看作是对象obj的属性。obj[str]和obj.str作用相同
				if ( !obj[ str ] ) { //如果对象中没有该属性，就添加该属性，并赋值1。
					obj[ str ] = 1;
				} else {
					obj[ str ]++; //如果存在的话，就让该属性加1.
				}
			}
			return obj;
		},
		// **对象转换成字符串
		objToS: function ( list ) {
			var str = ''; //创建空字符串
			for ( var i = 0; i < list.length; i++ ) { //遍历数组元素
				for ( var prop in list[ i ] ) { //遍历对象属性
					//如果对象属性是数组，就把对象属性和属性值用=连接，把对象的多个属性值用#连接；属性最后连接&
					if ( Array.isArray( list[ i ][ prop ] ) ) {
						//if判断主要是把price找到，并把属性值用#连接 			
						str += prop + "=" + list[ i ][ prop ].join( '#' ) + '&';
					} else { //如果不是，就把对象属性和属性值用=连接，属性最后连接&
						str += prop + "=" + list[ i ][ prop ] + '&';
					}
				}
				str = str.slice( 0, -1 ); //截取前面的所有，去掉最后的&
				str += '|'; //在每个对象之后连接|
			}
			str = str.slice( 0, -1 ); //去掉最后一个|
			return str; //返回str
		},
		//**字符串转换成对象
		strToO: function ( str ) {
			var list = str.split( '|' );
			var arr = [];
			for ( var i = 0; i < list.length; i++ ) {
				var listNew = list[ i ].split( "&" );
				//console.log(listNew);
				var obj = {};
				for ( var j = 0; j < listNew.length; j++ ) {
					if ( ~listNew[ j ].split( '=' )[ 1 ].indexOf( '#' ) ) {
						obj[ listNew[ j ].split( '=' )[ 0 ] ] = listNew[ j ].split( '=' )[ 1 ].split( '#' );
					} else {
						obj[ listNew[ j ].split( '=' )[ 0 ] ] = listNew[ j ].split( '=' )[ 1 ];
					}
				}
				arr.push( obj );
			}
			return arr;
		},
		//随机验证码
		randomCode: function () {
			//1、将所需数字和字母存储在一个数组中
			var arr = []; //创建空数组，用来存储0到9的数字和a-z，A-Z的所有字母
			for ( var i = 48; i < 123; i++ ) { //循环遍历数字，将数字转为对应字符
				if ( i < 58 ) {
					arr.push( String.fromCharCode( i ) ); //将0到9之间的数字存储到数组中			
				} else if ( i > 64 && i < 91 ) {
					arr.push( String.fromCharCode( i ) ); //将A到Z的之间的所有字母存储到arr中
				} else if ( i > 96 && i < 123 ) {
					arr.push( String.fromCharCode( i ) ); //将a到z之间的所有字母push到arr中
				}
			}
			//console.log(arr);
			//2、然后将数组中的元素进行随机乱序
			arr.sort( function () {
				return Math.random() - 0.5
			} );
			//3、将数组元素长度设为4
			arr.length = 4;
			document.write( arr.join( '' ) );
		},
		//获取url中的searchParams
		getUrlSearchParams: function ( url ) {
			const urlO = new URL( url );
			return urlO.searchParams;
		},
		//截取search：？name=yzx&age=18
		getSearchParams: function ( search ) {
			//1、首先去除？
			const qs = search.length > 0 ? search.substring( 1 ) : '';
			//2、分割 &
			const qsArr = qs.length ? qs.split( '&' ) : [];
			//3，分割 = ,遍历返回
			qsArr.map( item => item.split( '=' )[ 1 ] );
		},
		//获取日期零点时间
		getZeroDate: function ( ts ) {
			const current = new Date( ts );
			current.setHours( 0 );
			current.setMinutes( 0 );
			current.setSeconds( 0 );
			current.setMilliseconds( 0 );
			return current;
		},
		//日期格式化为时间戳
		// 		Date() 参数形式有7种
		// 		new Date("month dd,yyyy hh:mm:ss");
		// 		new Date("month dd,yyyy");
		// 		new Date("yyyy/MM/dd hh:mm:ss");
		// 		new Date("yyyy/MM/dd");
		// 		new Date(yyyy, mth, dd, hh, mm, ss);
		// 		new Date(yyyy, mth, dd);
		// 		new Date(ms);
		formatDate: function ( date ) {
			return new Date( date ).getTime();
			// 	return t.valueOf();
			// 	return t.parse();
		},
		//时间戳格式化为日期
		formatTime: function ( t ) {
			return moment( t ).format( "YYYY - MM - DD HH: mm: ss" );
		},
		//防抖函数
		funcDebon: function ( func, interval ) {
			let timer = null;
			return function ( event, name ) {
				clearTimeout( timer );
				event.persist && event.persist()
				timer = setTimeout( () => {
					func( event, name )
				}, interval )
			}
		},
		//实现一个clone函数：可以对 js中的5种主要数据类型（包括 Number、String、Object、Array、Boolean）进行复制。
		clone: function ( obj ) {
			//判断obj是不是对象，对象包括数组和null；
			//如果是对象且不是null
			if ( typeof obj === 'object' && typeof obj !== null ) {
				//判断是不是数组，是就创建一个空数组；反之就创建空对象
				let OA = obj instanceof Array ? [] : {};
				for ( let k in obj ) {
					//考虑到嵌套情况，如果属性对应的值为对象并且不为null，则递归复制
					typeof obj[ k ] === 'object' && typeof obj[ k ] !== 'null' ?
						OA[ k ] = clone( obj[ k ] ) :
						OA[ k ] = obj[ k ];
				}
				return OA;
			}
			return obj;
		},
		//**通用事件监听器
		//分别使用dom2||IE||dom0方式来绑定事件
		// 参数：操作的元素，事件名称，事件处理程序
		addEvent: function ( elem, type, handler ) {
			if ( elem.addEventListener ) {
				//事件类型，需要执行的函数，是否捕获
				elem.addEventListener( type, handler, false );
			} else if ( elem.attachEvent ) {
				elem.attachEvent( 'on' + type, function () {
					handler.call( elem );
				} );
			} else {
				elem[ 'on' + type ] = handler;
			}
		},
		//移除事件
		removeEvent: function ( elem, type, handler ) {
			if ( elem.removeEventListener ) {
				elem.removeEventListener( type, handler, false );
			} else if ( element, detachEvent ) {
				elem.detachEvent( 'on' + type, handler );
			} else {
				elem[ 'on' + type ] = null;
			}
		},
		//阻止事件（主要是事件冒泡，因为IE不支持事件捕获）
		stopPropagation: function ( ev ) {
			ev.stopPropagation ? ev.stopPropagation() : ev.cancelBubble = true;
		},
		//取消事件默认行为
		preventDefault: function ( event ) {
			event.preventDefault ? event.preventDefault() : event.returnValue = false;
		},
		//获取事件目标
		getTarget: function ( event ) {
			return event.target || event.srcElement;
		},
		//获取event对象的引用，获取事件的所有信息，确保随时能使用event；
		getEvent: function ( e ) {
			var ev = e || window.event;
			if ( !ev ) {
				var c = this.getEvent.caller;
				while ( c ) {
					ev = c.arguments[ 0 ];
					if ( ev && Event === ev.constructor ) break;
					c = c.caller;
				}
			}
			return ev;
		}
	}
} )();