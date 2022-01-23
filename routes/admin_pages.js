var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Page model
var Page = require('../models/page');

/*
 * GET pages index
 */
router.get('/', isAdmin, function (req, res) {
    Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
        res.render('admin/pages', {
            pages: pages
        });
    });
});

/*
 * GET add page
 */
router.get('/add-page', isAdmin, function (req, res) {

    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/add_page', {
        title: title,
        slug: slug,
        content: content
    });
});

/*
 * POST add page
 */
router.post('/add-page', function (req, res) {

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('content', 'Content must have a value.').notEmpty();

    let title = req.body.title;
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    let content = req.body.content;

    let errors = req.validationErrors();

    if (errors) {
        res.render('admin/add_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        });
    } else {
        /*Page.find({}).sort({sorting: 1}).exec(function (err, pages) {*/

        Page.findOne({slug: slug}, function (err, page) {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.');
                res.render('admin/add_page', {
                    title: title,
                    slug: slug,
                    content: content
                });
            } else {
                //merge all the variable with table
                var page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                });
                // save the record to db
                page.save(function (err) {
                    if (err)
                        return console.log(err);
                    // select all from  db to poulate local variables
                    Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.pages = pages;
                        }
                    });

                    req.flash('success', 'Page added!');
                    res.redirect('/admin/pages');
                });
            }
        });
    }

});

// Sort pages function
function sortPages(ids, callback) {
    let count = 0;
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        count++;

        (function (count) {
            Page.findById(id, function (err, page) {
                page.sorting = count;
                page.save(function (err) {
                    if (err)
                        return console.log(err);
                    ++count;
                    if (count >= ids.length) {
                        callback();
                    }
                });
            });
        })(count);

    }
}

/*
 * POST reorder pages
 */
router.post('/reorder-pages', function (req, res) {
    var ids = req.body['id[]'];

    sortPages(ids, function () {
        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
            }
        });
    });

});

/*
 * GET edit page
 */
router.get('/edit-page/:id', isAdmin, function (req, res) {

    Page.findById(req.params.id, function (err, page) {
        if (err)
            return console.log(err);

        res.render('admin/edit_page', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        });
    });

});

/*
 * POST edit page
 */
router.post('/edit-page/:id', function (req, res) {
    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('content', 'Content must have a value.').notEmpty();
    let title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    var id = req.params.id;
    var errors = req.validationErrors();
    if (errors) {
        res.render('admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        });
    } else {
        //select single record that is not equal to the id
        /*Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            console.log(pages);
        });*/
        //select single record that is not equal to the id
        /*Page.find({_id:{'$ne':'61e4a05b64bac098853b6ad9'}}, function (err, page) {
            if(err){
                console.log(err + 'error');
            }else{
                console.log(page.title);
            }
        });*/
        Page.findOne({slug: slug, _id: {'$ne': id}}, function (err, page) {
            //console.log(err)
            if(err){
                //console.log(slug);
                //console.log(id);
                req.flash('danger', 'Invalid Page Kindly Check.');
                res.render('admin/edit_page', {
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                });
            }
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.');
                res.render('admin/edit_page', {
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                });
            } else {

                Page.findById(id, function (err, page) {
                    if (err)
                        return console.log(err);

                    page.title = title;
                    page.slug = slug;
                    page.content = content;

                    page.save(function (err) {
                        if (err)
                            return console.log(err);

                        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.pages = pages;
                            }
                        });


                        req.flash('success', 'Page edited!');
                        res.redirect('/admin/pages/edit-page/' + id);
                    });

                });


            }
        });
    }

});

/*
 * GET delete page
 * CHECKED
 */
router.get('/delete-page/:id', isAdmin, function (req, res) {
    Page.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            return console.log(err);

        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
            }
        });

        req.flash('success', 'Page deleted!');
        res.redirect('/admin/pages/');
    });
});


// Exports
module.exports = router;


