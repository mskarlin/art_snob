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
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

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

  const imgColumn = (art, imgCheck) => {

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
                        />}
                </div>
                )
            })}
      </div>
    )
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
        <LinearProgressWithLabel value={Math.min(100 * state.newRoomShow.selectionRoom.clusterData.likes.length / 4.0, 100)}/>
        <div className='select-explain'>
          <Typography variant="body1" align="center">
            {'What do you think of '+ exploreCluster.description.toLowerCase() +' art, like those below?'}
          </Typography>
        </div>
        <div className='preference-flex'>
          {imgColumn(art.slice(0, art.length/2), imgCheck)}
          {imgColumn(art.slice(art.length/2, art.length), imgCheck)}
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


function TasteBrowse() {
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
                dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'});
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

function VibeView({vibe}) {

    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const [vibeImages, setVibeImages] = useState([]);

    useEffect(() => {
    
        fetch('/vibes/' + state.sessionId + '?vibe=' +  encodeURIComponent(vibe.Vibes) + '&n_records=4')
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
        <Card variant="outlined">
        <CardContent>
            <Typography color="textSecondary" gutterBottom>
            {vibe.Vibes}
            </Typography>
            <Typography variant="body2" component="p">
            {vibe.Tagline}
            </Typography>
            <div className='preference-flex'>
                {imgColumn(vibeImages.slice(0, 2), ()=>{})}
                {imgColumn(vibeImages.slice(2, vibeImages.length), ()=>{})}
            </div>

        </CardContent>
        
        <CardActions>
            <Button size="small" variant="outlined" color="secondary"
            onClick={() => {
            }}
            >Select!</Button>
        </CardActions>
        </Card>
            
        )

}

function VibeSelect() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const [vibes, setVibes] = useState([]);

    useEffect(() => {
    
        fetch('/vibes/'+state.sessionId)
        .then(data => data.json())
        .then(json => {
          setVibes(json.vibes)
        })
        .catch(e => {
            // handle error
            return e
        })
    
        }, [setVibes])


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
    let showPrices = false

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

    const maybeNewRoomCreate = (refresh=false) => {
        if (!('id' in state.newRoomShow.selectionRoom) || refresh) {
            const tmpRoom = {...state.blankRoom, id: uuidv4()}
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
                  <span className="material-icons md-36" onClick={buttonCopy().backFunc}>keyboard_backspace</span>
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
                  <span className="material-icons md-36" onClick={ () => dispatch({type: 'TOGGLE_VIBE_SELECT'}) }>keyboard_backspace</span>
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
                <span className="material-icons md-36" onClick={buttonCopy(false).backFunc}>keyboard_backspace</span>
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
                            onClick={() => {let tmpRoom = maybeNewRoomCreate(true)
                                dispatch({type: 'ADD_ROOM', 'room': tmpRoom});
                                navigate('/rooms/');
                            }}
                            >Continue</Button>
                            <Button size="small" variant="outlined"
                            onClick={() => {
                                maybeNewRoomCreate(true)
                                dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'});
                            }}
                            >Retake Taste Finder</Button>
                        </CardActions>
                    </Card>
                    <Typography variant="h5" component="p">
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
                            <Button size="small" variant="outlined" color="secondary" onClick={ () => dispatch({type: 'TOGGLE_VIBE_SELECT'}) }>Continue</Button>
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