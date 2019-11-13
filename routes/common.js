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
    getBody : function( start_dt, end_dt, size, source ){
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
    getBodyHour : function(size, source ){
        obj_body = {
            query : {
                bool : {
                    filter :[
                        {
                            range : {
                                startTime : {
                                    gte : "20191113090000",
                                    lte : "20191113100000"
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
    }
    
};


module.exports = common;