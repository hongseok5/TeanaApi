# ---------------------------------------------------------------------------
# How to use
# ---------------------------------------------------------------------------
how_to_use() {
    echo "how_to_use) $0 <mode>"
    echo
    echo "mode:"
	echo "    all : index.js, ws_server.js merge_call_stt.js if_evaluation.js start"
    	echo "    wss : ws_server.js start"
	echo "    ind : index.js start"
	echo "    merge : merge_call_stt.js start"
	echo "    if_evaluation : if_evaluation.js start"
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
# merge_call_stt.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "merge")]]
then
	$NODE_HOME/bin/${EXEC} ${EXEC_FILE3} > /dev/null &
	EXEC_CHECK3=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE3}" | wc -l`

	if [ "$EXEC_CHECK3" == "0"  ]; then
			echo "node ${EXEC_FILE3} start failed"
	else
			echo "node ${EXEC_FILE3} start"
	fi
fi



# ---------------------------------------------------------------------------
# if_evaluation.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "eval")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE4} > /dev/null &
        EXEC_CHECK4=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE4}" | wc -l`

        if [ "$EXEC_CHECK4" == "0"  ]; then
            echo "node ${EXEC_FILE4} start failed"
        else
            echo "node ${EXEC_FILE4} start"
        fi
fi

# ---------------------------------------------------------------------------
# if_uanalzyer.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "anal")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE5} > /dev/null &
        EXEC_CHECK5=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE5}" | wc -l`

        if [ "$EXEC_CHECK5" == "0"  ]; then
            echo "node ${EXEC_FILE5} start failed"
        else
            echo "node ${EXEC_FILE5} start"
        fi
fi



# ---------------------------------------------------------------------------
# if_dma_00003.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "dma03")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE6} > /dev/null &
        EXEC_CHECK6=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE6}" | wc -l`

        if [ "$EXEC_CHECK6" == "0"  ]; then
            echo "node ${EXEC_FILE6} start failed"
        else
            echo "node ${EXEC_FILE6} start"
        fi
fi



# ---------------------------------------------------------------------------
# if_dma_00004.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "dma04")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE7} > /dev/null &
        EXEC_CHECK7=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE7}" | wc -l`

        if [ "$EXEC_CHECK7" == "0"  ]; then
            echo "node ${EXEC_FILE7} start failed"
        else
            echo "node ${EXEC_FILE7} start"
        fi
fi


# ---------------------------------------------------------------------------
# if_dma_00005.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "dma05")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE8} > /dev/null &
        EXEC_CHECK8=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE8}" | wc -l`

        if [ "$EXEC_CHECK8" == "0"  ]; then
            echo "node ${EXEC_FILE8} start failed"
        else
            echo "node ${EXEC_FILE8} start"
        fi
fi
# ---------------------------------------------------------------------------
# channel_update.js start
# ---------------------------------------------------------------------------

if [[("${MODE}" = "all") || ("${MODE}" = "ch_updt")]]
then
        $NODE_HOME/bin/${EXEC} ${EXEC_FILE9} > /dev/null &
        EXEC_CHECK9=`ps -ef | grep -v "grep" | grep "node ${EXEC_FILE9}" | wc -l`

        if [ "$EXEC_CHECK9" == "0"  ]; then
            echo "node ${EXEC_FILE9} start failed"
        else
            echo "node ${EXEC_FILE9} start"
        fi
fi

