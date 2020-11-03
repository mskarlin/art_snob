import React, { useState, useReducer, useEffect, useRef, useContext } from 'react';
import { useTagFetch, useInfiniteScroll } from './feedHooks'
import {useArtData} from './artComponents'
import { store } from './store.js';
import { ArtCarousel } from './detailView'
import { tag_suggestions } from './tag_suggestions'
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

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

// todo: add blurring to the background while detail is open
// todo: move the detail box up since we don't have the overhead feed
// todo: rank tag importances by tf-idf scores -- we can deliver from the backend
// todo: allow for vertical menu to pop up for browsing within a particular interest
// todo: color the pills by interest of the member -- allow the member to set pills of interest in menu

export function ArtBrowse() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const classes = useStyles();
    const autoCompleteBox = useRef(null);

    const tagSetter = (e, v) => {
        if (e) {
           dispatch({type: 'CHANGE_CURRENT_TAG_SET', currentTagSet: v})
    }
    }

    const getMargin = () => {
        let margin = 40+77
        if (autoCompleteBox.current){
                margin = 40 + autoCompleteBox.current.clientHeight;
            }        
        return margin + 'px'
    }

    const browser = () => {
        if(state.artBrowseSeed){
            return(
            <div className="browse-holder">
                <div className="browse-feed ">
                    <div className="works-select-menu">
                        <div className="explain-menu">
                            <span className="material-icons md-36" onClick={() => {dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: null})}}>keyboard_backspace</span>
                            <div className="explain-text">Choose any work to fill your rooms</div>
                        </div>
                        <div className='auto-complete' ref={autoCompleteBox}>
                            <div className='auto-complete-background'>
                                    <Autocomplete
                                        multiple
                                        id="tags-standard"
                                        classes={classes}
                                        options={tag_suggestions}
                                        defaultValue={state.currentTagSet}
                                        onChange={tagSetter}
                                        renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            label="Browsing tags"
                                            placeholder="Type for tags..."
                                        />
                                        )}
                                    />
                            </div>
                        </div>
                    </div>
                    <div style={{'marginTop': getMargin()}}>
                    <ArtCarousel endpoints={ ['/likes/'+state.sessionId] } imgSize={'large'} />
                    <ArtCarousel endpoints={ state.currentTagSet.map((tag, index) => {return ('/tags/'+tag )})} imgSize={'large'} />                        
                    </div>
                </div>
            </div>
            )
        }
        else {
            return <div/>
        }
    }

return (browser())
}