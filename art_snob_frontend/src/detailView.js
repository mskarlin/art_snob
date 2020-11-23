import React, { useState, useReducer, useEffect, useRef, useContext } from 'react';
import { useTagFetch, useInfiniteScroll } from './feedHooks'
import {useArtData} from './artComponents'
import { addPropertyControls } from 'framer';
import { store } from './store.js';

export const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
}

function SingleCarousel({endpoint, index, showFavoriteSelect, initialImages={images:[], cursor: null, fetching: true}, imgSize=''}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const feedReducer = (state, action) => {
    switch (action.type) {
        case 'STACK_IMAGES':
            return {...state, images: state.images.concat(action.images), cursor: action.cursor}
        case 'FETCHING_IMAGES':
            return {...state, fetching: action.fetching}
        case 'RESET':
            return action.new_feed
        default:
            return state;
    }
    }
    const [feedData, feedDataDispatch] = useReducer(feedReducer, initialImages)
    const [loadMore, setLoadMore] = useState(false);
    // this changes every single render (since the cursor changes...) huge bug that took days to fix...
    const formatEndpoint = feedData.cursor ? endpoint+'?start_cursor='+feedData.cursor : endpoint
    const renderLikes = showFavoriteSelect ? state.likedArt : null

    useTagFetch(loadMore, feedDataDispatch, setLoadMore, endpoint, formatEndpoint, renderLikes)

    const displayWidths = {'': 126, 'large': 175}
    const initialWidth = (feedData.images.length + showFavoriteSelect)*displayWidths[imgSize]+15+'px'

    return (<div key={'feed-'+index.toString()} className={'carousal-spacing main-feed '+imgSize} style={{'width': initialWidth}}>
                {feedData.images.map((image, index) => {
                    const { name, images, id } = image
                    return (
                    <div key={'art-'+index.toString()+index.toString() } className={'imgholder ' + imgSize}>
                            <img
                            alt={name}
                            data-src={'https://storage.googleapis.com/artsnob-image-scrape/'+images}
                            className="imgholder img"
                            src={'https://storage.googleapis.com/artsnob-image-scrape/'+images}
                            style={{"pointerEvents": "all"}}
                            onClick={()=>{
                                dispatch({type: 'ART_DETAIL', id: id, ref: state.scrollRef})
                                }}
                            />
                    </div>
                    )
                })}
                {showFavoriteSelect && (<div className={'imgholder ' + imgSize}> 
                                            <span className="material-icons md-36">save_alt</span> 
                                            <div className='browse-imgtext'>Save art to find it here</div>
                                        </div>)}
                {feedData.fetching && (
                <div className='loadingbox'>
                    <p>...</p>
                </div>
                    )}
                    <div id='mini-feed-boundary' style={{ border: '1px solid black' }}></div>
                </div>
    )

}

export function ArtCarousel({endpoints, imgSize=''}) {
    // lists of carousels for each type of art

    const makeTitle = (endpoint) => {
        if (endpoint.substring(1, 14) == "similar_works") {
            return "Similar works for you"
        }
        else if (endpoint.substring(1,5) == "tags") {
            let tagName = endpoint.substring(6)
            return tagName.charAt(0).toUpperCase() + tagName.slice(1) + " works"
        }
        else if (endpoint.substring(1,6) == "likes") {
            return "My saved art"
        }
    }

    return (
            <div className='art-feed detail'>
            {endpoints.map((endpoint, eindex) => {
            return (
            <div key={'endpoint'+eindex}>
                <div className='detail-title-tag'>
                    <div className='detail-name'>
                    {makeTitle(endpoint)}
                    </div>
                </div>
                <div className={'art-feed-small ' + imgSize}>
                    <SingleCarousel imgSize={imgSize} endpoint={endpoint} showFavoriteSelect={endpoint.substring(1,6) == "likes"} index={eindex} key={'sc-'+eindex.toString()}/>
                </div>
            </div>
            )
            }
            )}
        </div>
            )
}


export function ArtDetail({nTags}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const scrollRef = useRef(null)
     
    const handleScrollClick = () => {
    if ('current' in scrollRef) {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView(true);
        }
    }
    }
    
    const ntags = nTags ? nTags : 10
    const [artData, setArtData] = useState({name: "", 
                                            size_price_list: [], 
                                            standard_tags: [], 
                                            artist: "",
                                            images: ""});
    useArtData(state.artDetailShow, setArtData, handleScrollClick)
    let artTags = ['/similar_works/'+state.artDetailShow]
    const endpoints = artTags.concat(artData.standard_tags.map(i => '/tags/'+i.toLowerCase()))

    // TODO: figure out why this doesnt update...
    const saveCopy = () => {
        if (state.likedArt.map((x) => x.artId).includes(artData.artId)) {
            return "Saved!"
            }
        else {
            return "Save for later"
        }
}

return ( state.artDetailShow && (
    <div className="locked-detail-container">
    <div className="detail-container" ref={scrollRef}>
        <div className="detail-title">
            <div className="detail-name">
            {artData.name}
            </div>
            <span className="material-icons md-36" onClick={() => dispatch({'type': 'ART_DETAIL', 'id': null})}>keyboard_backspace</span>
        </div>
        <div className="large-image">
        <img
            alt={artData.artist}
            data-src={'https://storage.googleapis.com/artsnob-image-scrape/'+artData.images}
            className="large-image img"
            src={'https://storage.googleapis.com/artsnob-image-scrape/'+artData.images}
            />
        </div>
        <div className="tag-holder">
        {artData.standard_tags.slice(0, ntags).map(i => {return <button className="tag-button" key={i}>{i}</button>})}
        </div>
        <div className="price-size-action-container">
            <div className="price-size">
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Sizes:</li>
            {artData.size_price_list.map(x => {
                return <li className="pricing" key={x}>{x.size}</li>
            })}
            </ul>
            </div>
            <div className="price-size" style={{'width': "15%"}}>
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Prices:</li>
            {artData.size_price_list.map(x => {
                return <li className="pricing" key={x}>{x.price}</li>
            })}
            </ul>
            </div>
            <div className="detail-purchase-buttons">
            <button className="detail-button" onClick={()=>{dispatch({'type': 'POTENTIAL_ART', 'artData': artData});
                                                            dispatch({'type': 'ART_DETAIL', 'id': null})
                                                            dispatch({'type': 'ART_BROWSE_SEED', 'artBrowseSeed': null})
                                                            dispatch({'type': 'CLOSE_ALL_MENUS'})
                                                            }}>Add to room</button>


            <button className="detail-button" style={{"backgroundColor":"#CED4DA"}} 
            onClick={()=>{dispatch({'type': 'LIKE_ART', 'art': artData})}}>{saveCopy()}</button>
            <button className="detail-button" style={{"backgroundColor":"#DEE2E6"}}
            onClick={() => {openInNewTab(artData.page_url+'?curator=mskarlin')}}>Purchase work</button>
            </div>
        </div>
        <ArtCarousel endpoints={endpoints}/>
    </div>
    </div>
))

}
