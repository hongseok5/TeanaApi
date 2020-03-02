# ---------------------------------------------------------------------------
# How to use
# ---------------------------------------------------------------------------
how_to_use() {
    echo "how_to_use) $0 <mode>"
    echo
    echo "mode:"
	echo "    all : index.js, ws_server.js merge_call_stt.js if_evaluation.js stop"
    	echo "    wss : ws_server.js stop"
	echo "    ind : index.js stop"
	echo "    merge : merge_call_stt.js stop"
	echo "    if_evaluation : if_evaluation.js stop"
    echo
    exit $1
}
# ---------------------------------------------------------------------------
# Environment (necessary setting)
# ---------------------------------------------------------------------------
EXEC_FILE="index.js"
EXEC_FILE2="ws_server.js"
EXEC_FILE3="merge_call_stt.js"
EXEC_FILE4="if_evaluation.js"
EXEC_FILE5="if_uanalzyer.js"
EXEC_FILE6="if_dma_00003.js"
EXEC_FILE7="if_dma_00004.js"
EXEC_FILE8="if_dma_00005.js"
EXEC_FILE9="channel_teana.js"

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------
MODE=$1
if [[ "$#" != "0" ]]; then shift; fi
if [[ "x$MODE" = "x" ]]; then how_to_use 1; fi
if [[ "x$MODE" = "xhelp" ]]; then how_to_use 1; fi
echo "MODE: ${MODE}"
# ---------------------------------------------------------------------------
# index.js stop
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "ind")]]
then
	EXEC_CHECK=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE}"`
	second1=$(echo ${EXEC_CHECK} | cut -d " " -f2)
	echo "PID: ${second1}"
	if [ -n "${second1}" ]
	then
			result1=$(kill -9 ${second1})
			echo "${EXEC_FILE} stop."
	else
			echo "${EXEC_FILE} not found."
	fi
fi

# ---------------------------------------------------------------------------
# ws_server.js stop
# ---------------------------------------------------------------------------

if [[(${MODE} = "all") || ("${MODE}" = "wss")]]
then
	EXEC_CHECK2=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE2}"`
	second2=$(echo ${EXEC_CHECK2} | cut -d " " -f2)
	echo "PID: ${second2}"
	if [ -n "${second2}" ]
	then
			result2=$(kill -9 ${second2})
			echo "${EXEC_FILE2} stop."
	else
			echo "${EXEC_FILE2} not found."
	fi
fi

# ---------------------------------------------------------------------------
# merge_call_stt.js stop
# ---------------------------------------------------------------------------

if [[(${MODE} = "all") || ("${MODE}" = "merge")]]
then
	EXEC_CHECK3=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE3}"`
	second3=$(echo ${EXEC_CHECK3} | cut -d " " -f2)
	echo "PID: ${second3}"
	if [ -n "${second3}" ]
	then
			result3=$(kill -9 ${second3})
			echo "${EXEC_FILE3} stop."
	else
			echo "${EXEC_FILE3} not found."
	fi
fi


# ---------------------------------------------------------------------------
# if_evaluation.js stop
# ---------------------------------------------------------------------------

if [[(${MODE} = "all") || ("${MODE}" = "eval")]]
then
        EXEC_CHECK4=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE4}"`
        second4=$(echo ${EXEC_CHECK4} | cut -d " " -f2)
        echo "PID: ${second4}"
        if [ -n "${second4}" ]
        then
                        result4=$(kill -9 ${second4})
                        echo "${EXEC_FILE4} stop."
        else
                        echo "${EXEC_FILE4} not found."
        fi
fi

# ---------------------------------------------------------------------------
# if_uanalzyer.js stop
# ---------------------------------------------------------------------------
if [[(${MODE} = "all") || ("${MODE}" = "anal")]]
then
        EXEC_CHECK5=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE5}"`
        second5=$(echo ${EXEC_CHECK5} | cut -d " " -f2)
        echo "PID: ${second5}"
        if [ -n "${second5}" ]
        then
                        result5=$(kill -9 ${second5})
                        echo "${EXEC_FILE5} stop."
        else
                        echo "${EXEC_FILE5} not found."
        fi
fi

# ---------------------------------------------------------------------------
# if_dma_00003.js stop
# ---------------------------------------------------------------------------
if [[(${MODE} = "all") || ("${MODE}" = "dma03")]]
then
        EXEC_CHECK6=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE6}"`
        second6=$(echo ${EXEC_CHECK6} | cut -d " " -f2)
        echo "PID: ${second6}"
        if [ -n "${second6}" ]
        then
                        result6=$(kill -9 ${second6})
                        echo "${EXEC_FILE6} stop."
        else
                        echo "${EXEC_FILE6} not found."
        fi
fi

# ---------------------------------------------------------------------------
# if_dma_00004.js stop
# ---------------------------------------------------------------------------
if [[(${MODE} = "all") || ("${MODE}" = "dma04")]]
then
        EXEC_CHECK7=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE7}"`
        second7=$(echo ${EXEC_CHECK7} | cut -d " " -f2)
        echo "PID: ${second7}"
        if [ -n "${second7}" ]
        then
                        result7=$(kill -9 ${second7})
                        echo "${EXEC_FILE7} stop."
        else
                        echo "${EXEC_FILE7} not found."
        fi
fi

# ---------------------------------------------------------------------------
# if_dma_00005.js stop
# ---------------------------------------------------------------------------
if [[(${MODE} = "all") || ("${MODE}" = "dma05")]]
then
        EXEC_CHECK8=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE8}"`
        second8=$(echo ${EXEC_CHECK8} | cut -d " " -f2)
        echo "PID: ${second8}"
        if [ -n "${second8}" ]
        then
                        result8=$(kill -9 ${second8})
                        echo "${EXEC_FILE8} stop."
        else
                        echo "${EXEC_FILE8} not found."
        fi
fi
# ---------------------------------------------------------------------------
# if_dma_00005.js stop
# ---------------------------------------------------------------------------
if [[(${MODE} = "all") || ("${MODE}" = "ch_updt")]]
then
        EXEC_CHECK9=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE9}"`
        second9=$(echo ${EXEC_CHECK9} | cut -d " " -f2)
        echo "PID: ${second9}"
        if [ -n "${second9}" ]
        then
                        result9=$(kill -9 ${second9})
                        echo "${EXEC_FILE9} stop."
        else
                        echo "${EXEC_FILE9} not found."
        fi
fi

