var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Category model
var Category = require('../models/category');

/*
 * GET category index
 */
router.get('/', isAdmin, function (req, res) {
    Category.find(function (err, categories) {
        if (err)
            return console.log(err);
        console.log(req.path)
        res.render('admin/categories', {
            categories: categories
        });
    });
});

/*
 * GET add category
 */
router.get('/add-category', isAdmin, function (req, res) {
    let title = "";
    /*show add category form*/
    res.render('admin/add_category', {
        title: title
    });
});
/*
 * POST add category
 */
router.post('/add-category', function (req, res) {
    /*start form validation*/
    req.checkBody('title', 'Title must have a value.').notEmpty();
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/add_category', {
            errors: errors,
            title: title
        });
        /*end form validation check*/
    } else {
        /*check if category already exist*/
        Category.findOne({slug: slug}, function (err, category) {
            if (category) {
                req.flash('danger', 'Category title exists, choose another.');
                res.render('admin/add_category', {
                    title: title
                });
            } else {
                /*match all input with category collection column name*/
                var category = new Category({
                    title: title,
                    slug: slug
                });
                /*end matching input with category collection column name*/
                /*save to category collection*/
                category.save(function (err) {
                    if (err)
                        return console.log(err);
                    /*Get all category collection*/
                    Category.find(function (err, categories) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.categories = categories;
                        }
                    });
                    req.flash('success', 'Category added!');
                    res.redirect('/admin/categories');
                });
            }
        });
    }

});

/*
 * GET edit category
 */
router.get('/edit-category/:id', isAdmin, function (req, res) {
    /*find category by id note:that GET is same as params*/
    Category.findById(req.params.id, function (err, category) {
        if (err)
            return console.log(err);

        res.render('admin/edit_category', {
            title: category.title,
            id: category._id
        });
    });

});

/*
 * POST edit category
 */
router.post('/edit-category/:id', function (req, res) {
    /*start form validation*/
    req.checkBody('title', 'Title must have a value.').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        });
    /*end form validation*/
    } else {
        /*check if category does not exist*/
        Category.findOne({slug: slug, _id: {'$ne': id}}, function (err, category) {
            if (category) {
                req.flash('danger', 'Category title exists, choose another.');
                res.render('admin/edit_category', {
                    title: title,
                    id: id
                });
            } else {
                /*find category by id*/
                Category.findById(id, function (err, category) {
                    if (err)
                        return console.log(err);

                    category.title = title;
                    category.slug = slug;

                    category.save(function (err) {
                        if (err)
                            return console.log(err);

                        Category.find(function (err, categories) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.categories = categories;
                            }
                        });

                        req.flash('success', 'Category edited!');
                        res.redirect('/admin/categories/edit-category/' + id);
                    });

                });


            }
        });
    }

});

/*
 * GET delete category
 */
router.get('/delete-category/:id', isAdmin, function (req, res) {
    /*delete category by id*/
    Category.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            return console.log(err);
        /*get all categories*/
        Category.find(function (err, categories) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.categories = categories;
            }
        });

        req.flash('success', 'Category deleted!');
        res.redirect('/admin/categories/');
    });
});


// Exports
module.exports = router;


