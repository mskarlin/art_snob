import React, { useState, useRef, useContext } from 'react';

import { store } from './store.js';
import { v4 as uuidv4 } from 'uuid';

import { ArtColumns, LikesColumns } from './detailView'
import { tag_suggestions } from './tag_suggestions'
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

const useStyles = makeStyles((theme) => ({
    root: {
      width: '80%',
      maxWidth: '500px',
      '& > * + *': {
        marginTop: theme.spacing(3),
      },
    },
    tag: {
        fontFamily: ["Noto Sans JP", "sans-serif"],
        fontStyle: "normal"
    },
    input: {
        fontFamily: ["Noto Sans JP", "sans-serif"],
        fontStyle: "normal"
    },
    inputRoot: {
        fontFamily: ["Noto Sans JP", "sans-serif"],
        fontStyle: "normal"
    },
    groupLabel: {
        fontFamily: ["Noto Sans JP", "sans-serif"],
        fontStyle: "normal"
    },
  }));

export function Search({query, navigate, children}) {
    // pre-loads a new room (if it doesn't exist)
    // this way, even a new entry can add to room without a tastefinder
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    if (state.rooms.length === 0){
        let tmpRoom = {...state.blankRoom, id: uuidv4()}
        dispatch({type: 'ADD_ROOM', 'room': tmpRoom});
        dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: tmpRoom});
        dispatch({type: 'TOGGLE_NEW_ROOM_SHOW', show: true});
    }
    else if (!('id' in state.artBrowseSeed)){
        dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.rooms[0]});
    }

    return (
        <ArtBrowse initialSearchTerm={query} navigate={navigate}/>
    )
}

export function ArtBrowse({children, navigate, initialSearchTerm=''}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const classes = useStyles();
    const autoCompleteBox = useRef(null);
    const [selectBrowseType, setSelectBrowseType] = useState(0)
    const [valueSetByURL, setValueSetByURL] = useState(initialSearchTerm!=='')
    // const [tagSeedBrowse, setTagSeedBrowse] = useState('')
    // find if the inital search term should be applied or not
    if (initialSearchTerm !== state.searchTagNames){
        if (valueSetByURL) {
            dispatch({type: 'CLEAR_FEED_IMAGES'})
            dispatch({type: 'CHANGE_SEARCH_TAG_SET', 
                    searchTagSet: '/search/'+encodeURIComponent(initialSearchTerm)+`?session_id=${state.sessionId}`, 
                    searchTagNames: initialSearchTerm})
            dispatch({type:'RELOAD_FEED', reload: true})
        }
    }
    
    const handleChange = (event, newValue) => {
        setSelectBrowseType(newValue);
      };


    const searchKeyPress = (e) => {
        if(e.keyCode == 13){
            dispatch({type:'RELOAD_FEED', reload: true})
            // put the login here
         }
    }

    // set the search state with each keystroke, but only search on enter
    const tagSetter = (event) => {
        if (event) {

            setValueSetByURL(false)

            if (event.target.value.length > 0) {
                dispatch({type: 'CLEAR_FEED_IMAGES'})
                dispatch({type: 'CHANGE_SEARCH_TAG_SET', 
                searchTagSet: '/search/'+encodeURIComponent(event.target.value)+`?session_id=${state.sessionId}`, 
                searchTagNames: event.target.value})
            }
            else {
                dispatch({type: 'CLEAR_FEED_IMAGES'})
                dispatch({type:'RELOAD_FEED', reload: true})
                dispatch({type: 'CHANGE_SEARCH_TAG_SET', searchTagSet: '', searchTagNames: ''})
            }
        }
    }

    const recommendedEndpoints = () => {
        // get seed art ids to send to the backend
        const likes = state.artBrowseSeed?.clusterData.likes.join(',')
        const dislikes = state.artBrowseSeed?.clusterData.dislikes.join(',')

        return '/recommended/' + state.sessionId
        + '?likes='+encodeURIComponent(likes)
        + '&dislikes='+encodeURIComponent(dislikes)
    }

    const getMargin = () => {
        let margin = 65
        if (autoCompleteBox.current){
                margin = autoCompleteBox.current.clientHeight-10;
            }        
        return margin + 'px'
    }

    const browser = () => {

        if(state.artBrowseSeed){
            return(
            <>
            {children}
            <div className="browse-holder">
                <div className="browse-feed ">
                    <div className="works-select-menu">
                        <div className="explain-menu">
                            <span className="material-icons md-28" onClick={() => {
                                navigate('/walls');
                                }}>arrow_back_ios</span>
                            <div className="explain-text">Choose any work to fill your walls</div>
                        </div>
                        <Tabs
                            value={selectBrowseType}
                            onChange={handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            centered
                            style={{ marginTop: "40px"}}
                            >
                            <Tab label="Explore" />
                            <Tab label="Favorites" />
                        </Tabs>
                        <div className='auto-complete' ref={autoCompleteBox}>
                            <div className='auto-complete-background'>
                                    <TextField
                                        style={{width: '33%', minWidth: '250px', maxWidth: '500px'}}
                                        onChange={tagSetter}
                                        onKeyDown={searchKeyPress}
                                        value={state.searchTagNames}
                                        variant="standard"
                                        label="Search for art..."
                                        placeholder="try green trees or impressionism"
                                    />
                            </div>
                        </div>
                    </div>
                    <div style={{'marginTop': getMargin()}}>
                    
                    <LikesColumns navigate={navigate} art={state.likedArt} showFavoriteSelect={(state.likedArt.length === 0)} show={(selectBrowseType === 1) && (state.searchTagSet === '')}/>
                    <ArtColumns key={"recommended-carousel"} title='Recommended Art' navigate={navigate} endpoint={recommendedEndpoints()} show={(selectBrowseType === 0) && (state.searchTagSet === '')}/>
                    <ArtColumns key={"tag-carousel"} title='Tag Results...' endpoint={state.searchTagSet} show={state.searchTagSet !== ''}/>

                    </div>
                </div>
            </div>
            </>
            )
        }
        else {
            return <></>
        }
    }

return (browser())
}