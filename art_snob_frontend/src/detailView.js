import React, { useState, useReducer, useEffect, useRef } from 'react';
import { useTagFetch, useInfiniteScroll } from './feedHooks'
import {useArtData} from './artComponents'
import { addPropertyControls } from 'framer';


function SingleCarousel(props) {

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
    const [feedData, feedDataDispatch] = useReducer(feedReducer, { images:[], cursor: null, fetching: true})
    const [loadMore, setLoadMore] = useState(false);
    // this changes every single render (since the cursor changes...)
    const formatEndpoint = feedData.cursor ? props.endpoint+'?start_cursor='+feedData.cursor : props.endpoint

    useTagFetch(loadMore, feedDataDispatch, setLoadMore, props.endpoint, formatEndpoint)

    return (<div key={'feed-'+props.index.toString()} className='carousal-spacing main-feed' style={{'width': feedData.images.length*126+15+'px'}}>
                {feedData.images.map((image, index) => {
                    const { artist, images, id } = image
                    return (
                    <div key={'art-'+index.toString()+props.index.toString() } className='imgholder'>
                            <img
                            alt={artist}
                            data-src={images}
                            className="imgholder img"
                            src={images}
                            style={{"pointerEvents": "all"}}
                            onClick={()=>{
                                props.setArtDetailShow(id);
                                }}
                            />
                    </div>
                    )
                })}
                {feedData.fetching && (
                <div className='loadingbox'>
                    <p>...</p>
                </div>
                    )}
                    <div id='mini-feed-boundary' style={{ border: '1px solid black' }}></div>
                </div>
    )

}

export function ArtCarousel(props) {
    // lists of carousels for each type of art

    const makeTitle = (endpoint) => {
        if (endpoint.substring(1, 14) == "similar_works") {
            return "Similar works for you"
        }
        else if (endpoint.substring(1,5) == "tags") {
            let tagName = endpoint.substring(6)
            return tagName.charAt(0).toUpperCase() + tagName.slice(1) + " works"
        }
    }


    return (
            <div className='art-feed detail'>
            {props.endpoints.map((endpoint, eindex) => {
            return (
            <div key={'endpoint'+eindex}>
                <div className='detail-title-tag'>
                    <div className='detail-name'>
                    {makeTitle(endpoint)}
                    </div>
                </div>
                <div className='art-feed-small'>
                    <SingleCarousel endpoint={endpoint} setArtDetailShow={props.setArtDetailShow} index={eindex} key={'sc-'+eindex.toString()}/>
                </div>
            </div>
            )
            }
            )}
        </div>
            )
}


export function ArtDetail(props) {
    const ntags = props.ntags ? props.ntags : 10
    const [artData, setArtData] = useState({name: "", 
                                            sizes: "", 
                                            standard_tags: [], 
                                            artist: "",
                                            images: ""});
    useArtData(props.artId, setArtData)
    let artTags = ['/similar_works/'+props.artId]
    const endpoints = artTags.concat(artData.standard_tags.map(i => '/tags/'+i.toLowerCase()))

return (
    <div className="locked-detail-container">
    <div className="detail-container">
        <div className="detail-title">
            <div className="detail-name">
            {artData.name}
            </div>
            <span className="material-icons md-36" onClick={() => {props.backButton(null)}}>keyboard_backspace</span>
        </div>
        <div className="large-image">
        <img
            alt={artData.artist}
            data-src={artData.images}
            className="large-image img"
            src={artData.images}
            />
        </div>
        <div className="tag-holder">
        {artData.standard_tags.slice(0, ntags).map(i => {return <button className="tag-button" key={i}>{i}</button>})}
        </div>
        <div className="price-size-action-container">
            <div className="price-size">
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Sizes:</li>
            {artData.sizes.split("| | |").join("--").split("|").map(x => {
                return <li className="pricing" key={x}>{x.split("--")[0]}</li>
            })}
            </ul>
            </div>
            <div className="price-size" style={{'width': "15%"}}>
            <ul style={{"listStyleType":"none", "padding": "0px"}}>
            <li className="pricing">Prices:</li>
            {artData.sizes.split("| | |").join("--").split("|").map(x => {
                return <li className="pricing" key={x}>{x.split("--")[1]}</li>
            })}
            </ul>
            </div>
            <div className="detail-purchase-buttons">
            <button className="detail-button" onClick={()=>{props.setPotentialArt(artData);
                                                            props.backButton(null)
                                                            }}>Add to room</button>
            <button className="detail-button" style={{"backgroundColor":"#CED4DA"}}>Save for later</button>
            <button className="detail-button" style={{"backgroundColor":"#DEE2E6"}}>Purchase work</button>
            </div>
        </div>
        <ArtCarousel endpoints={endpoints}
         setArtDetailShow={props.backButton}
         id={props.artId}
         />
    </div>
    </div>
)

}
