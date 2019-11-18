var moment = require('moment');

var common = {

    getIndex : function(code){
        switch(code){
            case "00":
                return "call_dev";
            case "01":
                return "mobile1";
            case "02":
                return "pc1";
            case "03":
                return "homepage1";
            case "04":
                return "ars1";
            default:
                return "mobile1,pc1,homepage1,ars1";
        }
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
            aggs : {}
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
        return Math.ceil( (current_value - base_value) / base_value * 100 ) ;
    },
    getDays : function (start_dt, end_dt, interval){
    	var startDt = moment(start_dt.slice(0,8));
    	var endDt = moment(end_dt.slice(0,8));
    	var days = endDt.diff(startDt, 'days');
    	var month = endDt.diff(startDt, 'months', true);
    	var returnval = new Array();
    	
    	if(interval == "1H"){
    		days++;
    		var z = 0;
    		for(var i=0; i<days; i++){
    			if(i == 0){
    				var setDay = start_dt.slice(0,8);
        			for(var j=0; j<24; j++){
        				z = i + j;
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
    			}else{
    				var setDay = startDt.add('days',1).format('YYYYMMDD');
        			for(var j=0; j<24; j++){
        				z = i + j;
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
        	}
    	}else if(interval == "1D"){
    		days++;
    		for(var i=0; i<days; i++){
    			if(i == 0){
    				var obj = {
       	    		   	key : start_dt.slice(0,8)+"01000000"
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
    }
};


module.exports = common;