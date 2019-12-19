# ---------------------------------------------------------------------------
# How to use
# ---------------------------------------------------------------------------
how_to_use() {
    echo "how_to_use) $0 <mode>"
    echo
    echo "mode:"
	echo "    all : index.js, ws_server.js start"
    echo "    wss : ws_server.js start"
	echo "    ind : index.js start"
    echo
    exit $1
}
# ---------------------------------------------------------------------------
# Environment (necessary setting)
# ---------------------------------------------------------------------------
API_HOME="/app/TeAna/TeAnaApi"
NODE_HOME="/app/node/node-v10.16.3-linux-x64"
EXEC="node"
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
# index.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "ind")]]
then
	$NODE_HOME/bin/${EXEC} ${EXEC_FILE} > /dev/null &
	EXEC_CHECK=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE}" | wc -l`
	
	if [ "$EXEC_CHECK" == "0"  ]; then
        echo "node ${EXEC_FILE} start failed"
	else
        echo "node ${EXEC_FILE} start"
	fi
fi

# ---------------------------------------------------------------------------
# ws_server.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "wss")]]
then
	$NODE_HOME/bin/${EXEC} ${EXEC_FILE2} > /dev/null &
	EXEC_CHECK2=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE2}" | wc -l`

	if [ "$EXEC_CHECK2" == "0"  ]; then
			echo "node ${EXEC_FILE2} start failed"
	else
			echo "node ${EXEC_FILE2} start"
	fi
fi

# ---------------------------------------------------------------------------
# if_evaluation.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "eval")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE3} > /dev/null &
        EXEC_CHECK3=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE3}" | wc -l`

        if [ "$EXEC_CHECK3" == "0"  ]; then
            echo "node ${EXEC_FILE3} start failed"
        else
            echo "node ${EXEC_FILE3} start"
        fi
fi

