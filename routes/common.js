var common = {

    getIndex : function(code){
        switch(code){
            case "00":
                return "call_dev";
            case "01":
                return "mobile";
            case "02":
                return "pc";
            case "03":
                return "homepage";
            case "04":
                return "ars";
            default:
                return "call_dev,mobile,pc,homepage,ars";
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