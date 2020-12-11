import React, { useState,  useEffect, useRef, useContext } from 'react';
import { navigate } from "@reach/router"

import LinearProgress from '@material-ui/core/LinearProgress';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Box from '@material-ui/core/Box';
import ThumbUpAltOutlinedIcon from '@material-ui/icons/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@material-ui/icons/ThumbDownAltOutlined';
import ClearOutlinedIcon from '@material-ui/icons/ClearOutlined';
import FindReplaceOutlinedIcon from '@material-ui/icons/FindReplaceOutlined';
import CircularProgress from '@material-ui/core/CircularProgress';

import Typography from '@material-ui/core/Typography';


import { store } from './store.js';
import { v4 as uuidv4 } from 'uuid';

function LinearProgressWithLabel(props) {
    return (
      <Box display="flex" alignItems="center" width="100%" height="40px" style={{width: "75%", paddingBottom: "15px"}}>
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(
            props.value,
          )}% inspired`}</Typography>
        </Box>
      </Box>
    );
  }

function ClusterView({art, exploreCluster}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const imgColumn = (art) => {

        const imgCheck = (artName) => {
          if (state.newRoomShow.selectionRoom.seedArt.map(a => a.artId).includes(artName)) {
            return 'selected'
          }
          else {
            return ''
          }
      }
        return (
          <div className='vert-column'>
            {art.map((image, index) => {
                    const { name, images, id } = image
                    return (
                    <div key={'art-'+index.toString()+index.toString() } className={'imgholder large'}>
                            
                            {(imgCheck(id)==='selected')?<span className="material-icons md-48" style={{'position': 'absolute',
                            'color': '#018E42', zIndex: 2}}>check_circle_outline</span>:<></>}

                            {(id===null)?<CircularProgress style={{'position': 'absolute',
                            'color': '#018E42', zIndex: 2}}/>:
                            <img
                            alt={name}
                            data-src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                            className={"imgholder img "+imgCheck(id)}
                            src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                            style={{"pointerEvents": "all"}}
                            onClick={() => dispatch({type: 'TOGGLE_SEED_ART',  seedArt: {...image, artId: id}})}
                            />}
                    </div>
                    )
                })}
          </div>
        )
      }

    return (
        <>
        <LinearProgressWithLabel value={Math.min(100 * state.newRoomShow.selectionRoom.clusterData.likes.length / 4.0, 100)}/>
        <div className='select-explain'>
          <Typography variant="body1" align="center">
            {'What do you think of '+ exploreCluster.description.toLowerCase() +' art, like those below?'}
          </Typography>
        </div>
        <div className='preference-flex'>
          {imgColumn(art.slice(0, art.length/2))}
          {imgColumn(art.slice(art.length/2, art.length))}
        </div>
        <ButtonGroup aria-label="outlined primary button group" style={{paddingTop: "15px"}}>
            <Button onClick={() => {
              dispatch({type: 'CLUSTER_LIKE', like: exploreCluster.cluster});
            }}>Like{<ThumbUpAltOutlinedIcon/>}</Button>
            <Button onClick={() => {
              dispatch({type: 'CLUSTER_SKIP'});
              }}>Skip{<ClearOutlinedIcon/>}</Button>
            <Button onClick={() => {
              dispatch({type: 'CLUSTER_DISLIKE', dislike: exploreCluster.cluster});
            }}>Dislike{<ThumbDownAltOutlinedIcon/>}</Button>
        </ButtonGroup>
        <Button onClick={() => {
              dispatch({type: 'CLUSTER_MORE'});
            }}>See more{<FindReplaceOutlinedIcon/>}</Button>
        </>
      )
}


function TasteBrowse({activeStep}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const [art, setArt] = useState([{'id': null},{'id': null},{'id': null},{'id': null}])
    const exploreEndpoint = '/explore/'+state.sessionId 
    + '?' + 'likes='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.likes.join(','))
    + '&' + 'dislikes='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.dislikes.join(','))
    + '&' + 'skip_n='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.skipN)
    + '&' + 'n_return='+(state.newRoomShow.selectionRoom.clusterData.startN*4+4).toString()
    + '&' + 'n_start='+(state.newRoomShow.selectionRoom.clusterData.startN*4).toString()
    const [exploreCluster, setExploreCluster] = useState({description: '', cluster: null})
    const length = state.newRoomShow.selectionRoom.clusterData.likes.length

    useEffect(() => {
    
        fetch(exploreEndpoint)
        .then(data => data.json())
        .then(json => {
          setArt(json.art)
          setExploreCluster({cluster: json.cluster, description: json.description})
        })
        .catch(e => {
            // handle error
            return e
        })

        if ( length / 4.0 >= 1.0) {
            // const tasteComplete = () => {
                dispatch({type: 'ADD_ROOM', 'room': state.newRoomShow.selectionRoom});
                dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.newRoomShow.selectionRoom});
                navigate('/browse/'+state.newRoomShow.selectionRoom.id);
              }

        // clean up - clear the tags
        return () => {
            setArt([{'id': null},{'id': null},{'id': null},{'id': null}])
        }
    
        }, [setArt, setExploreCluster, exploreEndpoint, length])
    
    return (
            <div style={{"marginTop": "45px", "height": "100%"}}>
                <div style={{"height": "100%"}}>
                    <div className='room-name-entry'>
                        <ClusterView art={art} exploreCluster={exploreCluster}/>
                    </div>
                </div>
            </div>
          )

}

export function TasteFinder() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const [activeStep, setActiveStep] = useState(0);

    const handleNext = () => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
  
    const handleBack = () => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
  
    const handleReset = () => {
      setActiveStep(0);
    };

    let roomStyle = {}
    let showPrices = false

    if (state.newRoomShow.show)
      {roomStyle = {...roomStyle, marginTop: '78px'}}

    // TODO: need to grey out buttons when a selection has yet to be made, then solidify when ready
    const buttonCopy = () =>{
      switch(activeStep) {
        case 0:
          return (
            {
              backFunc: () => {dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'});
                                navigate('/')
                                },
              backCopy: '',
              forCopy: 'Continue',
              forFunc: handleNext
            }
          )
        case 1:
          return (
            {
              backFunc: handleBack,
              backCopy: 'Back',
              forCopy: 'Add room and choose art',
              forFunc: () => {
                dispatch({type: 'ADD_ROOM', 'room': state.newRoomShow.selectionRoom});
                dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'});
                handleReset();
                dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.newRoomShow.selectionRoom})
              }
            }
          )

      }

    }

    const roomFeed = () => {
      if(state.newRoomShow.show){
        // if we didn't come from a room (to edit it) then we need to make a working room that we're going to be editing
        if (!('id' in state.newRoomShow.selectionRoom)) {
          const tmpRoom = {...state.blankRoom, id: uuidv4()}
          dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: true}})
        }
        return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-36" onClick={buttonCopy().backFunc}>keyboard_backspace</span>
                  <div className="explain-text">{buttonCopy().backCopy}</div>
                  {/* <div className="next-buttons">
                    <div className="explain-text-next">{buttonCopy().forCopy}</div>
                    <span className="material-icons md-36" onClick={buttonCopy().forFunc}>keyboard_arrow_right</span>
                  </div> */}
              </div>
              <TasteBrowse activeStep={activeStep}/>
            </div>
        )
      }
      else {
        return (<></>)
      }
    }


    return(
    <div className="room-main">
        <div className="room-feed" style={roomStyle}>
        {
          roomFeed()
        }
        </div>
    </div>
    )
  }