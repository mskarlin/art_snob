import React, { useState,  useEffect, useReducer, useContext } from 'react';
import { store, postData } from './store.js';

import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { navigate } from "@reach/router"
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import { Helmet } from "react-helmet";


const useBlogFetch = (formatEndpoint, dispatch) => {

    useEffect(() => {
        if (formatEndpoint) {
            fetch(process.env.REACT_APP_PROD_API_DOMAIN+formatEndpoint)
            .then(data => data.json())
            .then(json => {
                dispatch({ type: 'ADD_BLOG_CONTENT', content: json})
            })
            .catch(e => {
                // handle error
                return e
            })
    }
    }, [formatEndpoint, dispatch])
}

const blogParser = (contentStub, references) => {

    const key = Object.keys(contentStub)[0]
    const content = contentStub[key]

    switch(key) {
        case 'title':
            return <Typography variant='h3' paragraph={true}>{content}</Typography>
        case 'header':
                return <Typography variant='h6' paragraph={true}>{content}</Typography>
        case 'body':
            return <Typography variant='body1' paragraph={true}>{content.split('{').map(c => {
                
                const end = c.search('}')
                const referenceNum = parseInt(c.slice(0, end)) - 1

                if (end !== -1 & references.length > referenceNum){
                    if (c.length>end) {
                        return (<>
                                <Link href={references[referenceNum]}>{referenceNum+1}</Link>
                                {c.slice(end+1)}
                                </>
                                )
                    }
                    else {
                        return <Link href={references[referenceNum]}>{referenceNum+1}</Link>
                    }
                    
                }
                else{
                    return c
                }

            })}</Typography>
        case 'subtext':
            return <Typography variant='subtitle1' paragraph={true}>{content}</Typography>
        case 'image':
            return <Paper style={{'marginBottom': '10px'}}>
                        <img src={content} width={'100%'}/>
                    </Paper>
        case 'list':
            return (<List> 
                {
                    content.map(x => <ListItem key={'list'+x}><Typography variant='body1' key={'listt'+x}>{x}</Typography></ListItem>)
                }
            </List>)
        case 'table':
            return <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                        <TableRow>
                            {content.header.map(x => <TableCell  key={'headercell'+x}>{x}</TableCell>)}
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {content.data.map((row) => (
                            <TableRow key={'rowcell'+row[0]}>
                            {row.map( (x,_) => <TableCell  key={'rowinnercell'+x+_}>{x}</TableCell>)}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </TableContainer>
    }
}


const AuthorComponent = ({author, publishDate}) => {
    return (
        <Paper>
            <Typography variant='subtitle' paragraph={true}>by <b>{author.name}</b> | {author.title}, published {publishDate}</Typography>
        </Paper>
    )
}

const BlogTags = ({tags}) => {
    return (
        <Paper>
            <Typography variant='subtitle' paragraph={true}>Tags: {tags.join(', ')}</Typography>
        </Paper>
    )
}

const useStyles = makeStyles({
    root: {
      width: "80%",
      maxWidth: "500px",
      pointerEvents: "all",
      cursor: "pointer"
    }
  });

function BlogCard ({blog}) {
    const classes = useStyles();
    return (
    <Card variant="outlined" className={classes.root} onClick={() => navigate('/blog/'+encodeURIComponent(blog.title))}>
    <CardContent>
        <Typography color="textPrimary" variant="subtitle1" noWrap={true}>
        <b>{blog.title}</b>
        </Typography>
        <Typography color="textPrimary" variant="subtitle1" noWrap={true}>
        by {blog.author.name}
        </Typography>
        <Typography color="textPrimary" variant="body1" noWrap={true} paragraph={true}>
        Published: {blog.publish_date}
        </Typography>
        <BlogTags tags={blog.tags.slice(0,4)}/>
    </CardContent>
    </Card>
    )
}


export function BlogHub() {
    const dummyContent = {'articles': [{'article': `{"title": "", "text": [], "references": [], "tags": [], "author": {"name": "", "title": "", "bio": ""}, "publish_date": ""}`}]}
    const blogReducer = (state, action) => {
        switch (action.type) {
            case 'ADD_BLOG_CONTENT':
                return {...action.content}
            default:
                return state;
        }
        }
    const [content, contentDispatch] = useReducer(blogReducer, dummyContent)
    useBlogFetch('/list_blogs/', contentDispatch)
    const useableContent = content['articles'].map( a=> JSON.parse(a['article']))
    
    return (
        <div style={{'marginTop': '87px', 'marginLeft': 'auto', 'marginRight': 'auto', 'paddingLeft': '25px', 'paddingRight': '25px', 'maxWidth': '550px'}}>
            <Helmet>
            <title>{"Art Snob Blog"}</title>
            <meta name="description" 
            content={"Find the newest art and data science info from the Art Snob team."}/>
            </Helmet>
            <h1>Art Snob Blog</h1>
            {useableContent.map(x => <BlogCard blog={x}/>)}
        </div>
    )
}



export function Blog({name}) {

    const dummyContent = {'blog': {'article': `{"title": "", "text": [], "references": [], "tags": [], "author": {"name": "", "title": "", "bio": ""}, "publish_date": ""}`}}
    const [shareOpen, setShareOpen] = React.useState(false);
    const [shareEmail, setShareEmail] = React.useState('');
    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    const handleSaveEmail = (event) => {
        setShareEmail(event.target.value);
      }
    
      const handleShareClose = () => {
        setShareOpen(false);
      };

    const blogReducer = (state, action) => {
        switch (action.type) {
            case 'ADD_BLOG_CONTENT':
                return {...action.content}
            default:
                return state;
        }
        }

    const [content, contentDispatch] = useReducer(blogReducer, dummyContent)

    useBlogFetch(`/blog/${encodeURIComponent(name)}`, contentDispatch)

    const useableContent = JSON.parse(content['blog']['article'])

    return (
        <div style={{'marginTop': '87px', 'marginLeft': 'auto', 'marginRight': 'auto', 'paddingLeft': '25px', 'paddingRight': '25px', 'maxWidth': '550px'}}>
        <Helmet>
            <title>{useableContent.title}</title>
            <meta name="description" 
            content={useableContent.text[0]}/>
            </Helmet>
        <Button onClick={() => {
            navigate('/bloghub')
            }} color="primary">
            Blog home
            </Button>
            <h1>{useableContent.title}</h1>
            <AuthorComponent author={useableContent.author} publishDate={useableContent.publish_date}/>
            {useableContent.text.map(t => blogParser(t, useableContent.references))}
            <BlogTags tags={useableContent.tags}/>

            <Button onClick={() => {
                setShareOpen(true)
              }} color="primary">
                Subscribe for more info
              </Button>
              
              <Button onClick={() => {
            navigate('/bloghub')
            }} color="primary">
            Blog home
            </Button>

            <Dialog
              open={shareOpen}
              onClose={handleShareClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >

            <DialogTitle id="alert-dialog-title">{"Subscribe for blog updates"}</DialogTitle>
            <DialogActions>
            <div className='share-options'>
            <div>
            <TextField id="email-save" label="Email" value={shareEmail} onChange={handleSaveEmail}/>
            <Button onClick={() => {
                handleShareClose();
                postData('/actions/', { session: state.sessionId, action: 'blog:subscribe', item: shareEmail})
              }} color="primary">
                Send
              </Button>
              </div>
              </div>
              </DialogActions>
              </Dialog>
              
        </div>
        )
    }