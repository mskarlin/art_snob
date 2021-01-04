import React, { useState,  useEffect, useContext } from 'react';
import { navigate } from "@reach/router"
import { defaultAnalytics } from "./firebase.js"

import LinearProgress from '@material-ui/core/LinearProgress';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Box from '@material-ui/core/Box';
import ThumbUpAltOutlinedIcon from '@material-ui/icons/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@material-ui/icons/ThumbDownAltOutlined';
import CachedIcon from '@material-ui/icons/Cached';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import Typography from '@material-ui/core/Typography';


import { store } from './store.js';
import { v4 as uuidv4 } from 'uuid';

function LinearProgressWithLabel(props) {
    return (
      <Box display="flex" alignItems="center" width="100%" height="40px" style={{width: "75%", paddingTop: "15px"}}>
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

  const imgColumn = (art, imgCheck, size='large') => {

    return (
      <div className='vert-column'>
        {art.map((image, index) => {
                const { name, images, id } = image
                return (
                <div key={'art-'+index.toString()+index.toString() } className={'imgholder '+size}>
                        
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
                        />}
                </div>
                )
            })}
      </div>
    )
  }


const tasteCompletion = (clusterData) => {
  // need at least 1 like, so we keep going but
  // each like is 25% and there are a max of 25 actions, but you need one like
  // constants determined from google sheet
  let baseRate = clusterData.likes.length / 5.0
  let expTerm = (clusterData.nActions * 0.03)
  return 100 * (baseRate + expTerm)
}

function ClusterView({art, exploreCluster}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const imgCheck = (artName) => {
        if (state.newRoomShow.selectionRoom.seedArt.map(a => a.artId).includes(artName)) {
          return 'selected'
        }
        else {
          return ''
        }
    }

    return (
        <>
        <div className='select-explain'>
          <Typography variant="body1" align="center">
            {'What do you think of the below '}
            <b> {exploreCluster.description.toLowerCase()}</b>
            {' art?'}
          </Typography>
        </div>
        <div className='preference-flex'>
          {imgColumn(art.slice(0, art.length/2), imgCheck)}
          {imgColumn(art.slice(art.length/2, art.length), imgCheck)}
        </div>
        <ButtonGroup aria-label="outlined primary button group" style={{paddingTop: "15px"}}>
            <Button onClick={() => {
              dispatch({type: 'CLUSTER_LIKE', like: exploreCluster.cluster});
            }}>{<ThumbUpAltOutlinedIcon/>}</Button>
            <Button onClick={() => {
              dispatch({type: 'CLUSTER_SKIP', skipped: exploreCluster.cluster});
              }}>Skip</Button>
            <Button onClick={() => {
              dispatch({type: 'CLUSTER_DISLIKE', dislike: exploreCluster.cluster});
            }}>{<ThumbDownAltOutlinedIcon/>}</Button>
        </ButtonGroup>
        <Button onClick={() => {
              dispatch({type: 'CLUSTER_MORE'});
            }}>See more{<CachedIcon/>}</Button>

        <LinearProgressWithLabel value={Math.min(tasteCompletion(state.newRoomShow.selectionRoom.clusterData), 100)}/>
        </>
      )
}


function TasteBrowse() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const [art, setArt] = useState([{'id': null},{'id': null},{'id': null},{'id': null}])
    const exploreEndpoint = '/explore/'+state.sessionId 
    + '?likes='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.likes.join(','))
    + '&dislikes='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.dislikes.join(','))
    + '&skipped='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.skipped.join(','))
    + '&skip_n='+encodeURIComponent(state.newRoomShow.selectionRoom.clusterData.skipN)
    + '&n_return='+(state.newRoomShow.selectionRoom.clusterData.startN*4+4).toString()
    + '&n_start='+(state.newRoomShow.selectionRoom.clusterData.startN*4).toString()
    const [exploreCluster, setExploreCluster] = useState({description: '', cluster: null})
    const completion = tasteCompletion(state.newRoomShow.selectionRoom.clusterData)

    useEffect(() => {
    
        fetch(process.env.REACT_APP_PROD_API_DOMAIN+exploreEndpoint)
        .then(data => data.json())
        .then(json => {
          setArt(json.art)
          setExploreCluster({cluster: json.cluster, description: json.description})
        })
        .catch(e => {
            // handle error
            return e
        })

        if ( completion >= 100) {
                defaultAnalytics.logEvent('screen_view', {
                  screen_name: 'Finished Taste Finder'
                })
                dispatch({type: 'ADD_ROOM', 'room': state.newRoomShow.selectionRoom});
                dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.newRoomShow.selectionRoom});
                dispatch({type: 'TOGGLE_NEW_ROOM_SHOW', show: false});
                navigate('/browse/'+state.newRoomShow.selectionRoom.id);
              }

        // clean up - clear the tags
        return () => {
            setArt([{'id': null},{'id': null},{'id': null},{'id': null}])
        }
    
        }, [setArt, setExploreCluster, exploreEndpoint, completion, dispatch, state.newRoomShow.selectionRoom])
    
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

function VibeView({vibe}) {

    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const [vibeImages, setVibeImages] = useState([]);

    useEffect(() => {
    
        fetch(process.env.REACT_APP_PROD_API_DOMAIN+'/vibes/' + state.sessionId + '?vibe=' +  encodeURIComponent(vibe.Vibes) + '&n_records=4')
        .then(data => data.json())
        .then(json => {
            setVibeImages(json.art)
        })
        .catch(e => {
            // handle error
            return e
        })
    
        }, [setVibeImages])

    return (
        <div style={{'marginTop': "15px"}}>
            <Card variant="outlined">
            <CardContent>
                <Typography color="textSecondary" gutterBottom>
                {vibe.Vibes}
                </Typography>
                <Typography variant="body2" component="p">
                {vibe.Tagline}
                </Typography>
                <div className='preference-flex'>
                    {imgColumn(vibeImages.slice(0, 2), ()=>{}, '')}
                    {imgColumn(vibeImages.slice(2, vibeImages.length), ()=>{}, '')}
                </div>

            </CardContent>
            
            <CardActions>
                <Button size="small" variant="outlined" color="secondary"
                onClick={() => {
                  let vibeRoom = {...state.newRoomShow.selectionRoom, 
                    clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
                      skipN: 0, 
                      startN: 0,
                      likes: vibe.Clusters}}
                dispatch({type: 'ADD_ROOM', 'room': vibeRoom});
                dispatch({type: 'TOGGLE_VIBE_SELECT'});
                navigate('/rooms');
                }}
                >Select!</Button>
            </CardActions>
            </Card>
        </div>
        )

}

function VibeSelect() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const [vibes, setVibes] = useState([]);

    useEffect(() => {
    
        fetch(process.env.REACT_APP_PROD_API_DOMAIN+'/vibes/'+state.sessionId)
        .then(data => data.json())
        .then(json => {
          setVibes(json.vibes)
        })
        .catch(e => {
            // handle error
            return e
        })
    
        }, [setVibes, state.sessionId])


    return (<div style={{"marginTop": "45px", "height": "100%"}}>
                <div style={{"height": "100%"}}>
                    <div className='room-name-entry'>
                        {vibes.map((vibe) => {
                            return <VibeView vibe={vibe} key={'vibeview'+vibe}/>
                        }
                        )
                        }
                    </div>
                </div>
        </div>
        )
}


export function TasteFinder() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    let roomStyle = {marginTop: '78px'}

    // TODO: need to grey out buttons when a selection has yet to be made, then solidify when ready
    const buttonCopy = (isNewRoom=true) =>{
      if (isNewRoom) {
          return (
            {
              backFunc: () => {navigate('/')},
              backCopy: ''
            }
          )
      }
       else {
          return (
            {
              backFunc: () => {window.history.back();},
              backCopy: 'New room art options'
            }
          )
      }
    }

    const maybeNewRoomCreate = (refresh=false, keepClusters=false) => {
        if (!('id' in state.newRoomShow.selectionRoom) || refresh) {
            let tmpRoom = {...state.blankRoom, id: uuidv4()}
            // use the first room's cluster data if it exists
            if (keepClusters) {
              tmpRoom['clusterData'] = state.rooms[0].clusterData
            }
            dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: state.newRoomShow.show}})
            return tmpRoom
        }
    }

    const roomFeed = () => {
      if((state.rooms.length === 0) || (state.newRoomShow.show)){
        // if we didn't come from a room (to edit it) then we need to make a working room that we're going to be editing
        maybeNewRoomCreate()
        return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-28" style={{'paddingLeft': "10px", 'paddingTop': "10px"}} onClick={buttonCopy().backFunc}>arrow_back_ios</span>
                  <div className="explain-text">{buttonCopy().backCopy}</div>
              </div>
              <TasteBrowse/>
            </div>
        )
      }
      else if (state.vibeSelect) {
          return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-28" style={{'paddingLeft': "10px", 'paddingTop': "10px"}} onClick={ () => dispatch({type: 'TOGGLE_VIBE_SELECT'}) }>arrow_back_ios</span>
                  <div className="explain-text"></div>
              </div>
              <VibeSelect/>
            </div>
          )
      }
      // scenario where we have a new room with existing taste data
      else {
        return (<div className="works-select-menu">
                <div className="explain-menu">
                <span className="material-icons md-28" style={{'paddingLeft': "10px", 'paddingTop': "10px"}} onClick={buttonCopy(false).backFunc}>arrow_back_ios</span>
                <div className="explain-text">{buttonCopy(false).backCopy}</div>
                </div>
                    <div className='taste-card-select'>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                            Use current taste profile
                            </Typography>
                            <Typography variant="body2" component="p">
                            Recommendations for you.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" variant="outlined" color="secondary"
                            onClick={() => {let tmpRoom = maybeNewRoomCreate(true, true)
                                dispatch({type: 'ADD_ROOM', 'room': tmpRoom});
                                navigate('/rooms');
                            }}
                            >Continue</Button>
                            <Button size="small" variant="outlined"
                            onClick={() => {
                                maybeNewRoomCreate(true)
                                dispatch({type: 'TOGGLE_NEW_ROOM_SHOW', show: true});
                            }}
                            >Retake Taste Finder</Button>
                        </CardActions>
                    </Card>
                    <Typography variant="h5" component="p" align="center">
                            OR
                    </Typography>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                            Choose a vibe for this room
                            </Typography>
                            <Typography variant="body2" component="p">
                            Pre-chosen aesthetics.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" variant="outlined" color="secondary" onClick={ () => {
                            maybeNewRoomCreate(true);
                            dispatch({type: 'TOGGLE_VIBE_SELECT'}) }}>Continue</Button>
                        </CardActions>
                    </Card>
                    </div>
                </div>
                )
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