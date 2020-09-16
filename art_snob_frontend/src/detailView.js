import React, { useState, useReducer, useEffect, useRef } from 'react';
import { useMultiFetch, useInfiniteScroll } from './feedHooks'
import {useArtData} from './artComponents'
import { addPropertyControls } from 'framer';

export function ArtCarousel(props) {
    // lists of carousels for each type of art
    const feedReducer = (state, action) => {
        switch (action.type) {
          case 'STACK_IMAGES':
            // append images to the right list
            let tmp = Object.fromEntries( Object.keys(state).map( x => 
                (x == action.endpoint)?[x, {...state[x], images: state[x].images.concat(action.images), cursor: action.cursor}]:[x, state[x]]
                ))
            return tmp
          case 'FETCHING_IMAGES':
            let ftemp = Object.fromEntries( Object.keys(state).map( x => 
                (x == action.endpoint)?[x, {...state[x], fetching: action.fetching}]:[x, state[x]]
                ))
            return ftemp
          default:
            return state;
        }
      }
    // across each endpoint, build a data object and dispatch function via the reducer
    // must invert the state to be an array, rather than making an array of states
    const [allLoadStatus, setAllLoadStatus] = useState(Object.fromEntries(props.endpoints.map( x => [x, false])))
    const [allFeedData, allFeedDataDispatch] = useReducer(feedReducer, Object.fromEntries( props.endpoints.map( x => [x, { images:[], fetching: true, cursor: null}])))

    // set up fetchers for each feed
    let endpointWithQuery = props.endpoints.map( x => (allFeedData[x].cursor) ? x+'?start_cursor='+allFeedData[x].cursor : x)
    useMultiFetch(allLoadStatus, allFeedDataDispatch, setAllLoadStatus, endpointWithQuery)

    return (
        <div className='art-feed'>
        {Object.keys(allLoadStatus).map((endpoint, eindex) => {
            let feedData = allFeedData[endpoint];
        return (
                <div key={'feed-'+eindex.toString()} className='carousal-spacing main-feed' style={{'width': feedData.images.length*126+15+'px'}}>
                {feedData.images.map((image, index) => {
                    const { artist, images, id } = image
                    return (
                    <div key={'art-'+index.toString()+eindex.toString() } className='imgholder'>
                            <img
                            alt={artist}
                            data-src={images}
                            className="imgholder img"
                            src={images}
                            style={{"pointerEvents": "all"}}
                            onClick={()=>{
                                props.setArtDetailShow(id)}}
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
        )})}
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
            <button className="detail-button">Add to room</button>
            <button className="detail-button" style={{"backgroundColor":"#CED4DA"}}>Save for later</button>
            <button className="detail-button" style={{"backgroundColor":"#DEE2E6"}}>Purchase work</button>
            </div>
        </div>
        <ArtCarousel endpoints={['/tags/tropical', '/tags/paintings']}
         setArtDetailShow={props.backButton}/>
    </div>
    </div>
)

}
