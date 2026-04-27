'use strict';

/* import {
for some reason enableing this causes worker not to work. 

    ///Assert_Variable_Exists,
    //Assert_Variable_has_attribute,
   // Assert_Is_Array,
    //Argument_isDicionary,
    //Argument_isNumber,
    //Argument_isString,
    //Argument_isPrimarive,
    //Internal_DEVELOPMENT_ERROR
  } from 'Assertions.js';*/ 
// gFracIntergrationController drawCurrentStaus 

function Assert_Is_Array( arg , argname = 'argument')
{
    if (!gPRODUCTION) {
        console.assert(Array.isArray(arg) == true , `arg ${argname} is not array`); 
        }
}

/*
function drawIndicator( stage, current, maxval)
  { 
    if( maxval == 0 ) maxval = 1 ;
    const r =  ((height/2) -150) +  (stage * 20)  ; 
    let angle =   current * (2 * PI) / maxval ; 
    noFill(); 
    arc( width/2, height/2, r, r,  angle ,0  );
  }
    */ 
/*
    This worker computes intergration. 
    messages 'LOAD WEIGHTE GRAPH'
    'DEPTHS FROM'   [ returns a list of numbers ]
    'TOTAL DEPTH FROM',  [ returns single number ]
    'All TOTAL DEPTH FROM' 

    'LOAD WEIGHTE GRAPH/All TOTAL DEPTH FROM' 
    loads a whole graph. 

    computes a subset ( 0,1,3,4...90 )  of nodes
    If longer than a second since start sends a 'IN PROGRESS MARKER' 
    returns the values back as array
    [ 
        {nodeID:x , totalDepth:y}
    ]
*/ 

onmessage = (e) => {
    //console.log("Message received from main script"); 
    const message  = e.data; 
    //console.info(" Server said ::"+ inputVec ); 
    //console.log(JSON.stringify(message ));

   // console.log("ID->-" , message['messageID'] ); 
   // console.log("ID->" , message.messageID );
   // console.log("check->" , 0xF1EECE, message.messageCheck ); 
 
    //console.log( "MSg=", message ); 

    if(  message.messageID == 9313 ) 
    { 
        console.log("@@ LOAD GRAPH @@");
        console.assert(message.messageCheck == 0xF1EECE , "Message format failed"); 
        console.assert( Object.hasOwn(message, "graph", 'No attribute graph!') ); 
        handledLoadGraph( message.graph ); 
        return ; 
    }
    
    if( message.messageID == 5924 )
    { 
        console.log("@@ STEP DEPT WITH GRAPH @@");
        console.assert(message.messageCheck == 0xF1EECE , "Message format failed"); 
        console.assert( Object.hasOwn(message, "graph", 'No attribute graph!') ); 
        handleGraphAndStepDepth( message.graph , message.depthTarget); 

        return ; 
    }
    if( message.messageID == 7005 )
    { 
        console.log(`@@ Do all depths ${message.startIndex} , ${message.endIndex}` ); 
        console.assert(message.messageCheck == 0xF1EECE , "Message format failed"); 
        console.assert( Object.hasOwn(message, "graph", 'No attribute graph!') ); 
        console.assert( Number.isInteger(message.startIndex), 'expected number'); 
        console.assert( Number.isInteger(message.endIndex), 'expected number'); 
       
        handleGraphAllAllTotalDepths( message.graph , message.startIndex ,message.endIndex ); 
        return ; 
    }
    let  dontunderstand  = 
    { 
        messageID: 'MESSAGE NOT UNDERSTOOD', 
        messageCheck : 0xF1EECE,
        notUnderStoodID : message.messageID , 
        result : false  
    };
    postMessage(dontunderstand);
    console.log("Not a thing");

    // let workerResult = 'I am working'; 

    //console.log( "Worker:: my calc = 42 " ) ; 
    //console.log("Posting message back to main script");
  };
  //gMaxIsovistRadius
  //-----------------------------------------------------------------
  /**
   *    The graph is in this structure. 
   *    [ 
   *         {nodeID:'A', weighed_edges:[ ['B',0.8], ['C',0.2]]}, 
   *         {nodeID:'A', weighed_edges:[ ['B',0.8], ['C',0.2]]}
   *    ] 
   */
    let gTheGraph = null ; 
    let gTheNodeLookupTable = { }; 
  function handledLoadGraph( theGraph  )
  {
    //console.log("handledLoadGraph starting "); 
    console.assert(  Array.isArray( theGraph ), "The graph is not an array");    
    // console.table
    console.info("WebWorker sizeOf graph = " + theGraph.length ); 

    gTheGraph = theGraph ; //currently
    gTheNodeLookupTable = { }; // make is a Map  the use map.size 
   
    for( let node of theGraph )
    { 
        console.assert( 'nodeID'  in node , "No attribute NodeID" ); 
        gTheNodeLookupTable[  node.nodeID ] = node ; 
        if( node.weighed_edges.length == 0 )
        { 
            console.log( ` NO NODES ${node.nodeID}`); 
        }
    }
   
    let  theGraphLoadedOK = 
    { 
       messageID: 'LOAD_WEIGHTED_GRAPH_OK', 
       messageCheck : 0xF1EECE,
       result : true 
    };
    postMessage(theGraphLoadedOK);
  }
   //-----------------------------------------------------------------
   function  handleGraphAndStepDepth( theGraph ,depthTarget_)
   { 
    console.assert(  theGraph !=null , 'No Graph passed' ); 
    console.assert( depthTarget_ !=null , 'No target passed'); 
    console.assert( depthTarget_ >= 0 , "No negative targets"); 
    console.assert( depthTarget_ <= theGraph.length , "Must be index"); 
    console.assert(  Array.isArray( theGraph ), "The graph is not an array");    
    // console.table
    console.info("WebWorker sizeOf graph =" + theGraph.length ); 

    gTheGraph = theGraph ; //currently
    gTheNodeLookupTable = { }; // make is a Map  the use map.size 
   
    for( let node of gTheGraph)
    { 
        console.assert( 'nodeID'  in node , "No attribute NodeID" ); 
        gTheNodeLookupTable[  node.nodeID ] = node ; 
    }

    let the_depthMap =  computeAllshortestDistancesFrom( depthTarget_ ); 

    let loadGraphAndStepDepth = { 
        messageID: 'STEP_DEPTH_FROM_OK', 
        messageCheck : 0xF1EECE, 
        status: 'OK', 
        depthTarget: depthTarget_ , 
        depth_map : the_depthMap
    } 
    //console.log("posting back")

    postMessage(  loadGraphAndStepDepth); 
   }
//-----------------------------------------------------------------
   function depthMapToTotal( depth_map )
   { 
    let total = 0 ; 

    for (const key of Object.keys(depth_map)) 
    {
        total += depth_map[ key ]; //console.log(key, dictionary[key]);
    }
    return total ; 
   }
    //-----------------------------------------------------------------
    /**
     * 
     * @param {*} theGraph 
     * @param {number} startIndex 
     * @param {number} endIndex  ( endIndex > startIndex  )
     */
    function handleGraphAllAllTotalDepths(theGraph ,startIndex, endIndex  )
    { 
        console.assert(  theGraph !=null , 'No Graph passed' ); 
        console.assert( startIndex !=null , 'No target passed'); 
        console.assert( Number.isInteger( startIndex ) , 'start index not number ');
        console.assert( Number.isInteger( endIndex ) , 'start index not number ');
      
        console.assert( startIndex >= 0 , "No negative targets"); 
        console.assert( startIndex <= theGraph.length , "Must be index"); 
        console.assert(  Array.isArray( theGraph ), "The graph is not an array");
        console.assert( endIndex  >=  startIndex, ' index '+endIndex+' ' + startIndex);
        // console.table
        //console.info("-WebWorker sizeOf graph =" + theGraph.length ); 

        gTheGraph = theGraph ; //currently
        gTheNodeLookupTable = { }; // make is a Map  the use map.size 
       
        for( let node of gTheGraph)
        { 
            console.assert( 'nodeID'  in node , "No attribute NodeID" ); 
            gTheNodeLookupTable[  node.nodeID ] = node ; 
            if(  node.weighed_edges.length == 0 )
            { 
                console.log( "^No weights " + node.nodeID + " " + node.weighed_edges.length );
            }
        }
       

        let depthTable = { }; 

        for( let index =  startIndex  ; index <= endIndex ; index++)
        { 
            let the_depthMap =  computeAllshortestDistancesFrom( index );
            
            const total = depthMapToTotal(the_depthMap ); 
            if( total <= 0.0 ) 
            {   const  length = Object.keys(the_depthMap).length;
                console.log(" ZERO Length ID= " +index + " "+ length  ); 
                console.log(" Z =" + theGraph[ index ].weighed_edges.length  
                    + " "  +  theGraph[ index ].nodeID  );
            }
            depthTable[ index ] = total ; 
        }
        //console.table( depthTable ); 

        const result = 
        {
            messageID: 'ALL_FACTIONAL_DEPTHS_FOR_RANGE', 
            messageCheck : 0xF1EECE, 
            status: 'OK', 
            start: startIndex , 
            end  : endIndex, 
            depths_table : depthTable
        }
            //index 
        postMessage( result ); 
    }

   //-----------------------------------------------------------------
   /**
    * 
    * @returns Used by algorithums - this checks that there is a graph. 
    * If there is not returns a message back to the controller. 
    */
   function checkNoGraph()
   { 
    if( gTheGraph != null ) return true;  
    
    //console.error('No graph set in worker'); 
    
    let noGraph = { 
        messageID: 'NO_GRAPH_LOADED_ABORT', 
        messageCheck : 0xF1EECE, 
        result : true 
    } 
    postMessage(noGraph);
    return false ; 
   }
   //-----------------------------------------------------------------
   /*
     let theGraph = 
    [
        {nodeID:'A', weighed_edges:[ ['B',0.8], ['C',0.2]]}, 
        {nodeID:'B', weighed_edges:[ ['A',0.8], ['D',0.2], ['E',.3]]},
        {nodeID:'C', weighed_edges:[ ['A',0.2], ['D',0.2]]} ,
        {nodeID:'D', weighed_edges:[ ['C',0.2], ['B',0.2], ['J',.4]]},
        {nodeID:'J', weighed_edges:[ ['D',0.4], ['G',.3], [ 7,.3]]}, 
        {nodeID:'E', weighed_edges:[ ['B',0.3], ['F',0.1] ] }, 
        {nodeID:'F', weighed_edges:[ ['E',0.1], ['G',0.1] ]}, 
        {nodeID:'G', weighed_edges:[ ['F',0.1], ['G',0.1],['B',0.6] ]}, 
        {nodeID:7, weighed_edges:[ ['J',0.3]]}
    ] ;
   */
  //----------------------------------------------------------
  /**
   * priority que is [ depth,  lable ] eg. [ 0.1 , 'A' ]; 
   * @param {*} depth_ 
   * @param {*} node_ 
   * @returns 
   */
  function makePriorityQueEntry( depth_ , node_ )
  { 
    console.assert( Number.isFinite(depth_), 'depth is not a number') ; 
    //console.assert( Object.hasOwn( node_, 'nodeID') , 'node is not a node') ;
    console.assert( depth_ >= 0 , ' negative depths impossible'); 
    return  { depth:depth_ , nodeID:node_ }; 
  }
  //---------------------------------------------------------- 
  /**
   *  Push this item to the priority que. 
   * If another smaller entry is there forget it. 
   * priority que is [ depth,  lable ] eg. [ 0.1 , 'A' ]; 
   * @param {Array of Priorirt Que entries } priorityQue 
   * @param {*} depth_ 
   * @param {*} nodeID 
   */
 function priorityQuePushUniqe(  priorityQue,  depth_, nodeID )
  { 
    // pre-flight checks 
    console.assert( Array.isArray( priorityQue ), ' not an array ') ; 
    console.assert( Number.isFinite(depth_), 'depth is not a number') ; 
    //console.assert( Object.hasOwn(node_,'nodeID') , 'node is not a node') ;

    // check is in the queue 
    for( let it of priorityQue ) 
    { 
        if( it.nodeID == nodeID  )
        { 
            if( it.depth >  depth_ )
            { 
                it.depth = depth_ ; 
                return ; // no need to added. 
            }
        }
    }
    // if new push. 
    priorityQue.push( makePriorityQueEntry( depth_, nodeID ) ); 
  }
  //----------------------------------------------------------
  function computeAllshortestDistancesFrom( nodeLabel )
  { 
    //console.assert( nodeLabel ) ;
    console.assert( checkNoGraph() , 'No graph to work with'); 
    console.assert( gTheNodeLookupTable != null , "no node look up table"); 
    const origin =  gTheNodeLookupTable[ nodeLabel ]; 
    console.assert( origin.nodeID == nodeLabel , "Internal error gTheNodeLookupTable"); 
    let depthTable = { }; // NodeID -> depthj 

    let priorityQue = [  makePriorityQueEntry( 0, origin.nodeID )] ; 
    depthTable[ origin.nodeID   ] = 0.0 ; //perminatn record s
    for( let g = 0 ; g < 200000000 ;g++ )
    { 
        if( priorityQue.length <= 0 )
        {
            //console.log("<----------- END OF LIST ------------->"); 
            break ; 
        }
        const  currentNode =  priorityQue.pop() ;  // get the last value// [ 0 ] ; 
        
        console.assert( currentNode!=null , "current node null??"); 
        console.assert(  Object.hasOwn(currentNode, "nodeID") ,"No attribute nodeID") ;;
        // console.log( "cn=", JSON.stringify( currentNode )); 
        //console.log("CURRECT NODE = ", currentNode.nodeID , " D=", currentNode.depth ); 

        const  depth  =  depthTable[ currentNode.nodeID ]  ; 
    
        //console.log(  gTheNodeLookupTable[ currentNode.nodeID] ); 
        const  edges  =  gTheNodeLookupTable[ currentNode.nodeID].weighed_edges; 
        //Assert_Is_Array( edges , 'edges');
        //console.assert( Array.isArray( edges ), ' edges is Not an array ' + (typeof edges)); 
        for( let e of edges )
        { 
            const edgeID = e[0]; 
            const edgeWeight = e[1 ]; 
            //console.log( "edge=", edgeID , 'we=',  edgeWeight  ); 
            if(  edgeID in  depthTable )
            { 
                if( (depth +  edgeWeight) <  depthTable[ edgeID ])
                { 
                    depthTable[ edgeID ] = (depth +  edgeWeight) ;
                    const node = gTheNodeLookupTable[ edgeID ]
                    priorityQuePushUniqe( priorityQue, (depth +  edgeWeight), edgeID  ); 
                }
            }else
            { 
                depthTable[ edgeID ] = (depth +  edgeWeight) ;
                priorityQuePushUniqe( priorityQue, (depth +  edgeWeight), edgeID  ); 
            }
        }
        //@@@ TODO REPLACE SORT WITH PRIORITY QU
        priorityQue.sort((a, b) =>   b.depth - a.depth); //-
        //console.table(  priorityQue ); 
    } 
    const total = depthMapToTotal(depthTable ); 
    if( total <= 0.0 ) 
    { 
        console.log( " ID has null depth " + nodeLabel  ); 
        console.table( depthTable ); 
        console.log( " ID has null depth " + nodeLabel  + " \nEdges=" ); 
        const edges  =  gTheNodeLookupTable[ nodeLabel ].weighed_edges; 
        console.table( edges );
        console.log( " len = " + edges.length ); 
    }
    //console.log("---------------------------------");
    //console.table(  depthTable ) ;
    return depthTable; 
  }

//-----------------------------------------------------------------
function test_DepthFinding()
{ 
    /*let theGraph = 
    [
        {nodeID:'A', weighed_edges:[ ['B',0.8], ['C',0.2]]}, 
        {nodeID:'B', weighed_edges:[ ['A',0.8], ['D',0.2], ['E',.3]]},
        {nodeID:'C', weighed_edges:[ ['A',0.2], ['D',0.2]]} ,
        {nodeID:'D', weighed_edges:[ ['C',0.2], ['B',0.2], ['J',.4]]},
        {nodeID:'J', weighed_edges:[ ['D',0.4], ['G',.3], [ 'H',.3]]}, 
        {nodeID:'E', weighed_edges:[ ['B',0.3], ['F',0.1] ] }, 
        {nodeID:'F', weighed_edges:[ ['E',0.1], ['G',0.1] ]}, 
        {nodeID:'G', weighed_edges:[ ['F',0.1], ['G',0.1],['B',0.6] ]}, 
        {nodeID:'H', weighed_edges:[ ['J',0.3]]}
    ] ;
     */
    let theGraph = 
    [
        {nodeID:0, weighed_edges:[ [1,0.8], [2,0.2]]}, 
        {nodeID:1, weighed_edges:[ [0,0.8], [3,0.2], [4,.3]]},
        {nodeID:2, weighed_edges:[ [0,0.2], [3,0.2]]} ,
        {nodeID:3, weighed_edges:[ [2,0.2], [1,0.2], [8,.4]]},
        {nodeID:8, weighed_edges:[ [3,0.4], [6,.3], [ 7,.3]]}, 
        {nodeID:4, weighed_edges:[ [1,0.3], [5,0.1] ] }, 
        {nodeID:5, weighed_edges:[ [4,0.1], [6,0.1] ]}, 
        {nodeID:6, weighed_edges:[ [5,0.1], [6,0.1],[1,0.6] ]}, 
        {nodeID:7, weighed_edges:[ [8,0.3]]}
    ] ;
    handledLoadGraph( theGraph ); 
    computeAllshortestDistancesFrom(0); 
}
/*
// Example usage
const myVar = [1, 2, 3];
Argument_isArray(myVar, 'myVar');  // Passes if myVar is an array, otherwise throws an error

const myObj = { name: 'Alice', age: 30 };
Argument_isDicionary(myObj, 'myObj'); // Passes if myObj is a plain object

const num = 42;
Argument_isNumber(num, 'num');

// This will throw if gPRODUCTION = false:
Assert_Variable_Exists(undefined, 'someUndefinedVar');
*/

  /*
    depthReturn frmat 
    { 
       messageFormat: 
       depthTable: 
       [NodeID, Depth] 
    }
  */ 
//console.info("Fractional ! "); 
//test_DepthFinding(); 
