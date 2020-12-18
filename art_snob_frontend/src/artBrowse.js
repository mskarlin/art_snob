import React, { useState, useReducer, useEffect, useRef, useContext } from 'react';

import { navigate } from "@reach/router"
import { store } from './store.js';
import { ArtCarousel, ArtColumns, ArtDetail, LikesColumns } from './detailView'
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

export function ArtBrowse({children, navigate}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const classes = useStyles();
    const autoCompleteBox = useRef(null);
    const [selectBrowseType, setSelectBrowseType] = useState(0)
    const [tagSeedBrowse, setTagSeedBrowse] = useState('')

    
    const handleChange = (event, newValue) => {
        setSelectBrowseType(newValue);
      };

    const tagSetter = (e, v) => {
        if (e) {
            if (v.length > 0) {
                dispatch({type: 'CLEAR_FEED_IMAGES'})
                setTagSeedBrowse('/tags/'+v.join('|'))
            }
            else {
                dispatch({type: 'CLEAR_FEED_IMAGES'})
                dispatch({type:'RELOAD_FEED'})
                setTagSeedBrowse('')
            }
        }
    }

    const recommendedEndpoints = () => {
        // get seed art ids to send to the backend
        const likes = state.artBrowseSeed.clusterData.likes.join(',')
        const dislikes = state.artBrowseSeed.clusterData.dislikes.join(',')

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
                            <span className="material-icons md-36" onClick={() => {
                                navigate('/rooms');
                                }}>keyboard_backspace</span>
                            <div className="explain-text">Choose any work to fill your rooms</div>
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
                                    <Autocomplete
                                        multiple
                                        id="tags-standard"
                                        classes={classes}
                                        options={tag_suggestions}
                                        defaultValue={state.searchTagSet}
                                        onChange={tagSetter}
                                        renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            label="Search tags"
                                            placeholder="Type for tags..."
                                        />
                                        )}
                                    />
                            </div>
                        </div>
                    </div>
                    <div style={{'marginTop': getMargin()}}>
                    
                    <LikesColumns navigate={navigate} art={state.likedArt} showFavoriteSelect={(state.likedArt.length === 0)} show={(selectBrowseType == 1) && (tagSeedBrowse === '')}/>
                    <ArtColumns title='Recommended Art' navigate={navigate} endpoint={recommendedEndpoints()} show={(selectBrowseType == 0) && (tagSeedBrowse === '')}/>
                    <ArtColumns title='Tag Results...' endpoint={tagSeedBrowse} show={tagSeedBrowse !== ''}/>

                    </div>
                </div>
            </div>
            </>
            )
        }
        else {
            navigate('/taste')
            return <div/>
        }
    }

return (browser())
}