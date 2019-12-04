var moment = require('moment');

var common = {

    getIndex : function(code){
        switch(code){
            case "00":
                return "call_*";
            case "01":
                return "mobile";
            case "02":
                return "pc";
            case "03":
                return "homepage";
            case "04":
				return "ars";
			case "05":
				return "chat";
			case "06":
				return "alliance";
            default:
                return "call_*,mobile,pc,homepage,ars";
        }
    },
	getEmpty : function (value) {
		var rtn = false;
		if (typeof value != 'undefined' && value) {
			rtn = true;
		}
		return rtn;
	},
    getBody : function( start_dt, end_dt, size, from, source ){
    	var fromcheck = (parseInt(from)-1)*parseInt(size);
    	if(from !== undefined){
    		obj_body = {
    	            query : {
    	                bool : {
    	                    filter :[
    	                        {
    	                            range : {
    	                                startTime : {
    	                                    gte : start_dt,
    	                                    lte : end_dt
    	                                }
    	                            }
    	                        }
    	                    ]
    	                }
    	            },
    	            _source : source,
    	            aggs : {},
    	            size : size
    	        };
    		return obj_body;
    	}else{
    		obj_body = {
    	            query : {
    	                bool : {
    	                    filter :[
    	                        {
    	                            range : {
    	                                startTime : {
    	                                    gte : start_dt,
    	                                    lte : end_dt
    	                                }
    	                            }
    	                        }
    	                    ]
    	                }
    	            },
    	            _source : source,
    	            aggs : {},
    	            size : size,
    	            from : fromcheck
    	        };
    		return obj_body;
    	}
    },
    getBodyNoSize : function( start_dt, end_dt){
        obj_body2 = {
            query : {
                bool : {
                    filter :[
                        {
                            range : {
                                startTime : {
                                    gte : start_dt,
                                    lte : end_dt
                                }
                            }
                        }
                    ]
                }
            },
            aggs : {},
			size : 0
        };

        return obj_body2;
    },
    getAgeRange : function( age ){
        return parseInt(age) + 9;
    },
    getResult : function(code, message, api_name){
        result = {};
        result.status = {};
        result.data = {};
        result.status.code = code;
        result.status.message = message;
        result.status.api_name = api_name;
        return result;
    },
    getUpdownRate : function( base_value, current_value){
		if( base_value == 0){
			return "new";
		} else {
			let a = Math.ceil( (current_value - base_value) / base_value * 100 );
			return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "%"
		}
         
    },
    getDays : function (start_dt, end_dt, interval){
    	var startDt = moment(start_dt.slice(0,8));
    	var endDt = moment(end_dt.slice(0,8));
    	var startTime = moment(start_dt.slice(0,8));
    	var endTime = moment(end_dt.slice(0,8));
    	var time = endTime.diff(startTime, 'hours');
    	var days = endDt.diff(startDt, 'days');
    	var month = endDt.diff(startDt, 'months', true);
    	var returnval = new Array();
    	
    	if(interval == "1H"){
    		days++;
    		var z = 0;
    		for(var i=0; i<time; i++){
    			if(i == 0){
    				var setDay = start_dt.slice(0,8);
       				z = z+1;
       				if(j < 10){
       					var obj = {
       	    		       	key : setDay + "0"+j+"0000"
       	    		    }
       					returnval[z] = obj;	
       				}else{
       					var obj = {
           	    		    key : setDay + j +"0000"
           	    		}
       					returnval[z] = obj;	
       				}
    			}else{
    				var setDay = startDt.add('days',1).format('YYYYMMDD');
       				z = z+1;
       				if(j < 10){
       					var obj = {
        	    		   	key : setDay + "0"+j+"0000"
          	    		}
        				returnval[z] = obj;	
        			}else{
        				var obj = {
                	   	    key : setDay + j +"0000"
                	   	}
        				returnval[z] = obj;	
        			}
        		}
        	}
    	}else if(interval == "1D"){
    		days++;
    		for(var i=0; i<days; i++){
    			if(i == 0){
    				var obj = {
       	    		   	key : start_dt.slice(0,8)+"000000"
       	    		}
       				returnval[i] = obj;	
    			}else{
    				var obj = {
           	    	   	key : startDt.add('days',1).format('YYYYMMDD') + "000000"
           	    	}
           			returnval[i] = obj;
    			}
        	}
    	}else if(interval == "1M"){
    		month++;
    		for(var i=0; i<month; i++){
    			if(i == 0){
    				var obj = {
           	    	   	key : start_dt.slice(0,6)+"01000000"
           	    	}
           			returnval[i] = obj;	
        		}else{
        			var obj = {
               	       	key : startDt.add('months',1).format('YYYYMM') + "01000000"
               	    }
               		returnval[i] = obj;	
        		}
        	}
    	}	
    	
    	return returnval;
	},
	getCategory : function( code ){
		switch(code){
			case 1:
				return "AS관련";
			case 2:
				return "결제/환불관련";
			case 3:
				return "고객관련";
			case 4:
				return "고객아웃바운드";
			case 5:
				return "교환관련";
			case 6:
				return "당사제안";
			case 7:
				return "매체상담(방송/EC/ARS)";
			case 8:
				return "반품관련";
			case 9:
				return "배송/수거관련";
			case 10:
				return "상품문의";
			case 11:
				return "상품불만";
			case 12:
				return "소비자보호";
			case 13:
				return "주문/영수증문의";
			case 14:
				return "주문이탈";
			case 15:
				return "취소관련";
			case 16:
				return "컨택센터관련";
			case 17:
				return "프로모션";
			case 18:
				return "협력사관련";
			case 19:
				return "협력사 QnA";
			case 20:
				return "홈페이지";
			case 21:
				return "기타문의";
			default:
				return null;
		}
	},

	strToDate : function( str ){
		if( str.length === 14 ){
			var year = str.substring(0, 4);
			var month = str.substring(4, 6);
			var day = str.substring(6, 8);
			var hour = str.substring(8, 10);
			var minute = str.substring(10, 12);
			var second = str.substring(12, 14);
			var date = new Date(year, month-1, day, hour, minute, second);
			return date;
		} else {
			return null;
		}	
	},
	 
	convertDuration : function( value ){
		if ( value < 0 ) {
			return '';
		} else if ( value > 60 ){
			let min = value / 60;
			let sec = value % 60;
			return parseInt(min) + "분 " + sec + "초 ";
		} else {
			return value + "초";
		}
	},
	
	convertDtm : function( value ){
		if ( value.length === 14){
			return `${value.slice(8,10)}:${value.slice(10,12)}:${value.slice(12,14)}`
		} else {
			return value;
		}
	},
	
	convertEmpty : function( value ){
		if (typeof value != 'undefined' && value) {
			return value;
		} else {
			return '';
		}
	},
	
	convertCategory : function( value ){
		return parseInt(value);
	}

  
};


module.exports = common;