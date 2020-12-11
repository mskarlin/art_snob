import React, { useState, useReducer, useEffect, useRef, useContext } from 'react';
import { useTagFetch, useInfiniteScroll } from './feedHooks'
import {useArtData} from './artComponents'
import { addPropertyControls } from 'framer';
import { store } from './store.js';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import _ from 'lodash';
import { navigate, useLocation } from "@reach/router"


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
    const endpointBuilder  = (endpoint) => {
        if (endpoint.search('\\?') !== -1) {
            return feedData.cursor ? endpoint+'&start_cursor='+feedData.cursor : endpoint
        }
        else {
            return feedData.cursor ? endpoint+'?start_cursor='+feedData.cursor : endpoint
        }
    }
    
    const formatEndpoint = endpointBuilder(endpoint)
    const renderLikes = showFavoriteSelect ? state.likedArt : null

    useTagFetch(loadMore, feedDataDispatch, setLoadMore, endpoint, formatEndpoint, renderLikes)

    const displayWidths = {'': 126, 'large': 175}
    const initialWidth = (feedData.images.length + 1 + showFavoriteSelect)*displayWidths[imgSize]+15+'px'

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
                                navigate('/detail/'+id)
                                }}
                            />
                    </div>
                    )
                })}
                {showFavoriteSelect && (<div className={'imgholder ' + imgSize}> 
                                            <span className="material-icons md-36" style={{'color': 'black'}}>save_alt</span> 
                                            <div className='browse-imgtext'>Save art to find it here</div>
                                        </div>)}
                {feedData.fetching && (
                <div className='loadingbox'>
                    <p>...</p>
                </div>
                    )}
                    <div className={'imgholder ' + imgSize} style={{'pointerEvents': 'all'}} onClick={()=>setLoadMore(true)}> 
                        <span className="material-icons md-36" style={{'color': 'black'}}>add_circle_outline</span> 
                        <div className='browse-imgtext'>Show me more.</div>
                    </div>
                </div>
    )

}

export function ArtCarousel({endpoints, imgSize='', showTitle=true}) {
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
        else if (endpoint.substring(1,5) == "feed") {
            return "Recommended Art"
        }
    }

    return (
            <div className='art-feed detail'>
            {endpoints.map((endpoint, eindex) => {
            return (
            <div key={'endpoint'+eindex}>
                {(showTitle)?
                <div className='detail-title-tag'>
                    <div className='detail-name'>
                    {makeTitle(endpoint)}
                    </div>
                </div>: <></>}
                <div className={'art-feed-small ' + imgSize}>
                    <SingleCarousel imgSize={imgSize} endpoint={endpoint} showFavoriteSelect={endpoint.substring(1,6) == "likes"} index={eindex} key={'sc-'+endpoint}/>
                </div>
            </div>
            )
            }
            )}
        </div>
            )
}

function ImgColumn ({art, navigate}) {

    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const location = useLocation();
    
    return (
      <div className='vert-column'>
        {art.map((image, index) => {
                const { name, images, id } = image
                return (
                <div key={'art-'+index.toString()+index.toString() } className={'imgholder large'}>
                        {(id===null)?<CircularProgress style={{'position': 'absolute',
                        'color': '#018E42', zIndex: 2}}/>:
                        <img
                        alt={name}
                        data-src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                        className={"imgholder img "}
                        src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                        style={{"pointerEvents": "all"}}
                        onClick={() => {
                            dispatch({type: 'ART_DETAIL', id: id, ref: state.scrollRef});
                            navigate('/detail/'+id)
                            }}
                        />}
                </div>
                )
            })}
      </div>
    )
  }

const useArtColumnFetch = (loadMore, dispatch, endpoint, formatEndpoint) => {
    useEffect(() => {
        if (formatEndpoint) {
            fetch(formatEndpoint)
            .then(data => data.json())
            .then(json => {
                dispatch({ type: 'ADD_FEED_IMAGES', images: json.art, cursor: json.cursor})
            })
            .catch(e => {
                // handle error
                return e
            })
    }
    }, [dispatch, endpoint, loadMore])
}

export function ArtColumns({title, endpoint, navigate, numColumns=2, show=true}) {
    // TODO: figure out implementation for likes and explore here... then work out the
    // TODO: detail url implementation, you should be able to share URLs of art wherever you find it
    // TODO: if you find it in your browse feed, then the link should probably go to a room feed
    // TODO: and then it'll have to build the default room if it doesn't exist-- then when you 
    // TODO: try to get to the browse feed, it'll simply run you back to the taste flow.
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    // this changes every single render (since the cursor changes...) huge bug that took days to fix...
    const endpointBuilder  = (endpoint) => {
        if (endpoint.search('\\?') !== -1) {
            return state.artBrowseSeed.feedCursor ? endpoint+'&start_cursor='+state.artBrowseSeed.feedCursor: endpoint
        }
        else if (endpoint == '') {
            return null
        }
        else {
            return state.artBrowseSeed.feedCursor ? endpoint+'?start_cursor='+state.artBrowseSeed.feedCursor : endpoint
        }
    }
    
    const formatEndpoint = endpointBuilder(endpoint)

    useArtColumnFetch(state.artBrowseSeed.reload, dispatch, endpoint, formatEndpoint)

    const displayWidths = {'': 126, 'large': 175}

    const showControl = () => {
        if (show) {
            return (<>
                <div className='select-explain'>
                    <Typography variant="h5" align="center">
                    {title}
                    </Typography>
                </div>
    
                <div className='preference-flex'>
                    {_.range(numColumns).map((i) => {
                        return <ImgColumn key={'pArtCol-'+i.toString()} navigate={navigate} art={state.artBrowseSeed.feed.slice(i*state.artBrowseSeed.feed.length/numColumns, 
                        (i+1)*state.artBrowseSeed.feed.length/numColumns)}/>
                    })}
                </div>
                
                <div className={'imgholder large'} style={{'pointerEvents': 'all', 'width': '100%', 'height': '100px'}} onClick={()=>dispatch({type: 'RELOAD_FEED'})}> 
                        <span className="material-icons md-36" style={{'color': 'black'}}>add_circle_outline</span> 
                        <div className='browse-imgtext'>Show me more.</div>
                </div>

                </>)
        }
        else {
            return <></>
        }
    }

    return (
    showControl()
  )
}

export function LikesColumns({art, numColumns=2, showFavoriteSelect, show}) {

    const showCondition = () => {
        if (show) {
            return (
            <>  
                <div className='select-explain'>
                    <Typography variant="h5" align="center">
                    {'Saved Art'}
                    </Typography>
                </div>

                <div className={'imgholder large'}> 
                    <span className="material-icons md-36" style={{'color': 'black'}}>save_alt</span> 
                    <div className='browse-imgtext'>Save art to find it here</div>
                </div>
                {console.log('ART', art)}
                <div className='preference-flex'>
                    {_.range(numColumns).map((i) => {
                        return <ImgColumn key={'pArtCol-'+i.toString()} navigate={navigate} art={art.slice(i*art.length/numColumns, 
                        (i+1)*art.length/numColumns)}/>
                    })}
                </div>
                </>
            )
        }
        else {
            return (<></>)
        }


    }

    return (
        showCondition()
)
}



export function ArtDetail({nTags, id}) {
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
    useArtData(id, setArtData, handleScrollClick)

    let artTags = ['/similar_works/'+id]
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

return (
    <div className="fullpage-detail-container">
    <div className="detail-container" ref={scrollRef}>
        <div className="detail-title">
            <div className="detail-name">
            {artData.name}
            </div>
            <span className="material-icons md-36" onClick={() => {
            dispatch({'type': 'ART_DETAIL', 'id': null});
            window.history.back();}
            }>keyboard_backspace</span>
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
                return <li className="pricing" key={'size_'+x.size}>{x.size}</li>
            })}
            </ul>
            </div>
            <div className="price-size" style={{'width': "15%"}}>
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Prices:</li>
            {artData.size_price_list.map(x => {
                return <li className="pricing" key={'price_'+x.price}>{x.price}</li>
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
)

}
