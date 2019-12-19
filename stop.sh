# ---------------------------------------------------------------------------
# How to use
# ---------------------------------------------------------------------------
how_to_use() {
    echo "how_to_use) $0 <mode>"
    echo
    echo "mode:"
	echo "    all : index.js, ws_server.js stop"
    echo "    wss : ws_server.js stop"
	echo "    ind : index.js stop"
    echo
    exit $1
}
# ---------------------------------------------------------------------------
# Environment (necessary setting)
# ---------------------------------------------------------------------------
EXEC_FILE="index.js"
EXEC_FILE2="ws_server.js"
EXEC_FILE3="if_evaluation.js"

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
# ws_server.js start
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
# if_evaluation.js start
# ---------------------------------------------------------------------------

if [[(${MODE} = "all") || ("${MODE}" = "eval")]]
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

