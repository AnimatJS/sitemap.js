/*!
 * Sitemap
 * Copyright(c) 2011 Eugene Kalinin
 * MIT Licensed
 */

var sm = require('../index'),
    fs = require('fs'),
    zlib = require('zlib'),
    assert = require('assert'),
    sinon = require('sinon');

var urlset = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
             'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" ' +
             'xmlns:xhtml="http://www.w3.org/1999/xhtml" ' +
             'xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" ' +
             'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" ' +
             'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">';

var dynamicUrlSet = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

var removeFilesArray = function(files) {
  if (files && files.length) {
    files.forEach(function(file) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }
};

module.exports = {
  'sitemap item: default values && escape': function () {
    var url = 'http://ya.ru/view?widget=3&count>2'
      , smi = new sm.SitemapItem({'url': url});

    assert.eql(smi.toString(),
              '<url> '+
                  '<loc>http://ya.ru/view?widget=3&amp;count&gt;2</loc> '+
              '</url>');
  },
  'sitemap item: error for url absence': function () {
    assert.throws(
      function() { new sm.SitemapItem(); },
      /URL is required/
    );
  },
  'sitemap item: full options': function () {
    var url = 'http://ya.ru'
      , smi = new sm.SitemapItem({
          'url': url,
          'img': "http://urlTest.com",
          'lastmod': '2011-06-27',
          'changefreq': 'always',
          'priority': 0.9,
          'mobile' : true
        });

    assert.eql(smi.toString(),
              '<url> '+
                  '<loc>http://ya.ru</loc> '+
                  '<lastmod>2011-06-27</lastmod> '+
                  '<changefreq>always</changefreq> '+
                  '<priority>0.9</priority> '+
                  '<image:image>'+
                  '<image:loc>'+
                  'http://urlTest.com'+
                  '</image:loc>'+
                  '</image:image> '+
                  '<mobile:mobile/> '+
              '</url>');
  },
  'sitemap item: lastmodISO': function () {
    var url = 'http://ya.ru'
      , smi = new sm.SitemapItem({
          'url': url,
          'lastmodISO': '2011-06-27T00:00:00.000Z',
          'changefreq': 'always',
          'priority': 0.9
        });

    assert.eql(smi.toString(),
              '<url> '+
                  '<loc>http://ya.ru</loc> '+
                  '<lastmod>2011-06-27T00:00:00.000Z</lastmod> '+
                  '<changefreq>always</changefreq> '+
                  '<priority>0.9</priority> '+
              '</url>');
  },
  'sitemap item: lastmod from file': function () {
    var tempFile = require('fs').openSync('/tmp/tempFile.tmp', 'w');
    require('fs').closeSync(tempFile);

    var stat = require('fs').statSync('/tmp/tempFile.tmp');


    var dt = new Date( stat.mtime );
    var lastmod = sm.utils.getTimestampFromDate(dt);

    var url = 'http://ya.ru'
      , smi = new sm.SitemapItem({
          'url': url,
          'img': "http://urlTest.com",
          'lastmodfile': '/tmp/tempFile.tmp',
          'changefreq': 'always',
          'priority': 0.9
        });

    require('fs').unlinkSync('/tmp/tempFile.tmp');

    assert.eql(smi.toString(),
              '<url> '+
                  '<loc>http://ya.ru</loc> '+
                  '<lastmod>'+ lastmod +'</lastmod> '+
                  '<changefreq>always</changefreq> '+
                  '<priority>0.9</priority> '+
                  '<image:image>'+
                  '<image:loc>'+
                  'http://urlTest.com'+
                  '</image:loc>'+
                  '</image:image> '+
              '</url>');
  },
  'sitemap item: lastmod from file with lastmodrealtime': function () {
    var tempFile = require('fs').openSync('/tmp/tempFile.tmp', 'w');
    require('fs').closeSync(tempFile);

    var stat = require('fs').statSync('/tmp/tempFile.tmp');

    var dt = new Date( stat.mtime );
    var lastmod = sm.utils.getTimestampFromDate(dt, true);

    var url = 'http://ya.ru'
      , smi = new sm.SitemapItem({
          'url': url,
          'img': "http://urlTest.com",
          'lastmodfile': '/tmp/tempFile.tmp',
          'lastmodrealtime': true,
          'changefreq': 'always',
          'priority': 0.9
        });

    require('fs').unlinkSync('/tmp/tempFile.tmp');

    assert.eql(smi.toString(),
              '<url> '+
                  '<loc>http://ya.ru</loc> '+
                  '<lastmod>'+ lastmod +'</lastmod> '+
                  '<changefreq>always</changefreq> '+
                  '<priority>0.9</priority> '+
                  '<image:image>'+
                  '<image:loc>'+
                  'http://urlTest.com'+
                  '</image:loc>'+
                  '</image:image> '+
              '</url>');
  },
  'sitemap item: toXML': function () {
    var url = 'http://ya.ru'
      , smi = new sm.SitemapItem({
          'url': url,
          'img': "http://urlTest.com",
          'lastmod': '2011-06-27',
          'changefreq': 'always',
          'priority': 0.9
        });

    assert.eql(smi.toString(),
              '<url> '+
                  '<loc>http://ya.ru</loc> '+
                  '<lastmod>2011-06-27</lastmod> '+
                  '<changefreq>always</changefreq> '+
                  '<priority>0.9</priority> '+
                  '<image:image>'+
                      '<image:loc>'+
                        'http://urlTest.com'+
                      '</image:loc>'+
                  '</image:image> '+
              '</url>');
  },
  'sitemap empty urls': function () {
    var sm_empty = new sm.Sitemap();

    assert.eql(sm_empty.urls, [])
  },
  'sitemap.urls is an array': function () {
    var url = 'ya.ru';
    var sm_one = new sm.Sitemap(url);

    assert.eql(sm_one.urls, [url]);
  },
  'simple sitemap': function() {
    var url = 'http://ya.ru';
    var ssp = new sm.Sitemap();
    ssp.add(url);

    assert.eql(ssp.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
                urlset + '\n'+
                '<url> '+
                    '<loc>http://ya.ru</loc> '+
                '</url>\n'+
              '</urlset>');
  },
  'simple sitemap with dynamic xmlNs': function() {
    var url = 'http://ya.ru';
    var ssp = sm.createSitemap({
      xmlNs: 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    });
    ssp.add(url);

    assert.eql(ssp.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
                dynamicUrlSet + '\n'+
                '<url> '+
                    '<loc>http://ya.ru</loc> '+
                '</url>\n'+
              '</urlset>');
  },
  'simple sitemap toXML async with two callback arguments': function(beforeExit, assert) {
    var url = 'http://ya.ru';
    var ssp = new sm.Sitemap();
    ssp.add(url);

    ssp.toXML(function(err, xml) {
      assert.isNull(err);
      assert.eql(xml,
                '<?xml version="1.0" encoding="UTF-8"?>\n'+
                urlset + '\n'+
                  '<url> '+
                      '<loc>http://ya.ru</loc> '+
                  '</url>\n'+
                '</urlset>');
    });
  },
  'simple sitemap toXML sync': function() {
    var url = 'http://ya.ru';
    var ssp = new sm.Sitemap();
    ssp.add(url);

    assert.eql(ssp.toXML(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://ya.ru</loc> '+
                '</url>\n'+
              '</urlset>');
  },
  'simple sitemap toGzip sync': function() {
    var ssp = new sm.Sitemap();
    ssp.add('http://ya.ru');

    assert.eql(ssp.toGzip(), zlib.gzipSync(
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://ya.ru</loc> '+
                '</url>\n'+
              '</urlset>'
    ));
  },
  'simple sitemap toGzip async': function() {
    var ssp = new sm.Sitemap();
    ssp.add('http://ya.ru');

    ssp.toGzip(function(error, result) {
      assert.eql(error, null);
      assert.eql(zlib.gunzipSync(result).toString(),
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            urlset + '\n'+
            '<url> ' +
            '<loc>http://ya.ru</loc> ' +
            '</url>\n' +
            '</urlset>'
      );
    });
  },
  'build sitemap index': function() {
    var expectedResult = '<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<?xml-stylesheet type="text/xsl" href="https://test.com/style.xsl"?>\n'+
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n'+
    '<sitemap>\n'+
    '<loc>https://test.com/s1.xml</loc>\n'+
    '</sitemap>\n'+
    '<sitemap>\n'+
    '<loc>https://test.com/s2.xml</loc>\n'+
    '</sitemap>\n'+
    '</sitemapindex>';

    var result = sm.buildSitemapIndex({
      urls: ['https://test.com/s1.xml', 'https://test.com/s2.xml'],
      xslUrl: 'https://test.com/style.xsl'
    });

    assert.eql(result, expectedResult);
  },
  'build sitemap index with custom xmlNS': function() {
    var expectedResult = '<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
        '<sitemap>\n'+
            '<loc>https://test.com/s1.xml</loc>\n'+
        '</sitemap>\n'+
        '<sitemap>\n'+
            '<loc>https://test.com/s2.xml</loc>\n'+
        '</sitemap>\n'+
    '</sitemapindex>';

    var result = sm.buildSitemapIndex({
        urls: ['https://test.com/s1.xml', 'https://test.com/s2.xml'],
        xmlNs: 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    });

    assert.eql(result, expectedResult);
  },
  'simple sitemap index': function() {
    var tmp = require('os').tmpdir(),
        url1 = 'http://ya.ru',
        url2 = 'http://ya2.ru',
        expectedFiles = [
          tmp + '/sm-test-0.xml',
          tmp + '/sm-test-1.xml',
          tmp + '/sm-test-index.xml'
        ];

    assert.throws(
      function() {
        var ssp = sm.createSitemapIndex({
          cacheTime: 600000,
          hostname: 'http://www.sitemap.org',
          sitemapName: 'sm-test',
          sitemapSize: 1,
          targetFolder: '/tmp2',
          urls: [url1, url2]
        });
      },
      /UndefinedTargetFolder/
    );

    // Cleanup before run test
    removeFilesArray(expectedFiles);

    var ssp = sm.createSitemapIndex({
      cacheTime: 600000,
      hostname: 'http://www.sitemap.org',
      sitemapName: 'sm-test',
      sitemapSize: 1,
      targetFolder: tmp,
      urls: [url1, url2],
      callback: function(err, result) {
        assert.eql(err, null);
        assert.eql(result, true);
        expectedFiles.forEach(function(expectedFile) {
          assert.eql(fs.existsSync(expectedFile), true);
        });
      }
    });
  },
  'sitemap without callback': function() {
    sm.createSitemapIndex({
      cacheTime: 600000,
      hostname: 'http://www.sitemap.org',
      sitemapName: 'sm-test',
      sitemapSize: 1,
      targetFolder: require('os').tmpdir(),
      urls: ['http://ya.ru', 'http://ya2.ru']
    });
  },
  'sitemap with gzip files': function() {
    var tmp = require('os').tmpdir(),
        url1 = 'http://ya.ru',
        url2 = 'http://ya2.ru',
        expectedFiles = [
          tmp + '/sm-test-0.xml.gz',
          tmp + '/sm-test-1.xml.gz',
          tmp + '/sm-test-index.xml'
        ];

    // Cleanup before run test
    removeFilesArray(expectedFiles);

    sm.createSitemapIndex({
      cacheTime: 600000,
      hostname: 'http://www.sitemap.org',
      sitemapName: 'sm-test',
      sitemapSize: 1,
      targetFolder: tmp,
      gzip: true,
      urls: [url1, url2],
      callback: function(err, result) {
        assert.eql(err, null);
        assert.eql(result, true);
        expectedFiles.forEach(function(expectedFile) {
          assert.eql(fs.existsSync(expectedFile), true);
        });
      }
    });
  },
  'lpad test': function() {
    assert.eql(sm.utils.lpad(5, 2), '05');
    assert.eql(sm.utils.lpad(6, 2, '-'), '-6');
  },
  'distinctValues test': function() {
    assert.eql(sm.utils.distinctArray([1, 2, 2, 5, 2]), [1, 2, 5]);
  },
  'sitemap: hostname, createSitemap': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: '/',         changefreq: 'always', priority: 1 },
            { url: '/page-1/',  changefreq: 'weekly', priority: 0.3 },
            { url: '/page-2/',  changefreq: 'daily',  priority: 0.7 },
            { url: '/page-3/',  changefreq: 'monthly',  priority: 0.2, img: '/image.jpg' },
            { url: 'http://www.test.com/page-4/',  changefreq: 'never',  priority: 0.8 },
          ]
        });

    assert.eql(smap.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/</loc> '+
                    '<changefreq>always</changefreq> '+
                    '<priority>1.0</priority> '+
                '</url>\n'+
                '<url> '+
                    '<loc>http://test.com/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
                '<url> '+
                    '<loc>http://test.com/page-2/</loc> '+
                    '<changefreq>daily</changefreq> '+
                    '<priority>0.7</priority> '+
                '</url>\n'+
                '<url> '+
                    '<loc>http://test.com/page-3/</loc> '+
                    '<changefreq>monthly</changefreq> '+
                    '<priority>0.2</priority> '+
                    '<image:image>'+
                        '<image:loc>http://test.com/image.jpg</image:loc>'+
                    '</image:image> '+
                '</url>\n'+
                '<url> '+
                    '<loc>http://www.test.com/page-4/</loc> '+
                    '<changefreq>never</changefreq> '+
                    '<priority>0.8</priority> '+
                '</url>\n'+
              '</urlset>');
  },
  'sitemap: invalid changefreq error': function() {
    assert.throws(
      function() {
        sm.createSitemap({
          hostname: 'http://test.com',
          urls: [{ url: '/', changefreq: 'allllways'}]
        }).toString();
      },
      /changefreq is invalid/
    );
  },
  'sitemap: invalid priority error': function() {
    assert.throws(
      function() {
        sm.createSitemap({
          hostname: 'http://test.com',
          urls: [{ url: '/', priority: 1.1}]
        }).toString();
      },
      /priority is invalid/
    );
  },
  'sitemap: test cache': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          cacheTime: 500,  // 0.5 sec
          urls: [
            { url: '/page-1/',  changefreq: 'weekly', priority: 0.3 }
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';

    // fill cache
    assert.eql(smap.toString(), xml);
    // change urls
    smap.add('http://test.com/new-page/');
    // check result from cache (not changed)
    assert.eql(smap.toString(), xml);

    // check new cache
    // after cacheTime expired
    setTimeout( function () {
      // check new sitemap
      assert.eql(smap.toString(),
                '<?xml version="1.0" encoding="UTF-8"?>\n'+
                urlset + '\n'+
                  '<url> '+
                      '<loc>http://test.com/page-1/</loc> '+
                      '<changefreq>weekly</changefreq> '+
                      '<priority>0.3</priority> '+
                  '</url>\n'+
                  '<url> '+
                      '<loc>http://test.com/new-page/</loc> '+
                  '</url>\n'+
                '</urlset>');
    }, 1000);
  },
  'sitemap: test cache off': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          // cacheTime: 0,  // cache disabled
          urls: [
            { url: '/page-1/',  changefreq: 'weekly', priority: 0.3 }
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';

    assert.eql(smap.toString(), xml);
    // change urls
    smap.add('http://test.com/new-page/');
    // check result without cache (changed one)
    assert.eql(smap.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
                '<url> '+
                    '<loc>http://test.com/new-page/</loc> '+
                '</url>\n'+
              '</urlset>');
  },
  'sitemap: handle urls with "http" in the path': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: '/page-that-mentions-http:-in-the-url/',  changefreq: 'weekly', priority: 0.3 }
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-that-mentions-http:-in-the-url/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';

    assert.eql(smap.toString(), xml);
  },
  'sitemap: handle urls with "&" in the path': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: '/page-that-mentions-&-in-the-url/',  changefreq: 'weekly', priority: 0.3 }
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-that-mentions-&amp;-in-the-url/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';

    assert.eql(smap.toString(), xml);
  },
  'sitemap: keep urls that start with http:// or https://': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: 'http://ya.ru/page-1/',  changefreq: 'weekly', priority: 0.3 },
            { url: 'https://ya.ru/page-2/',  changefreq: 'weekly', priority: 0.3 },
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
                urlset + '\n'+
                '<url> '+
                    '<loc>http://ya.ru/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
                '<url> '+
                    '<loc>https://ya.ru/page-2/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';

    assert.eql(smap.toString(), xml);
  },
  'sitemap: del by string': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: 'http://ya.ru/page-1/',  changefreq: 'weekly', priority: 0.3 },
            { url: 'https://ya.ru/page-2/',  changefreq: 'weekly', priority: 0.3 },
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>https://ya.ru/page-2/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';
    smap.del('http://ya.ru/page-1/');

    assert.eql(smap.toString(), xml);
  },
  'sitemap: del by object': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: 'http://ya.ru/page-1/',  changefreq: 'weekly', priority: 0.3 },
            { url: 'https://ya.ru/page-2/',  changefreq: 'weekly', priority: 0.3 },
          ]
        })
      , xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>https://ya.ru/page-2/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                '</url>\n'+
              '</urlset>';
    smap.del({url: 'http://ya.ru/page-1/'});

    assert.eql(smap.toString(), xml);
  },
  'test for #27': function() {
        var staticUrls = ['/', '/terms', '/login']
        var sitemap = sm.createSitemap({urls: staticUrls});
        sitemap.add({url: '/details/' + 'url1'});

        var sitemap2 = sm.createSitemap({urls: staticUrls});

        assert.eql(sitemap.urls, ['/', '/terms', '/login', {url: '/details/url1'}]);
        assert.eql(sitemap2.urls, ['/', '/terms', '/login' ]);
  },
  'sitemap: langs': function() {
    var smap = sm.createSitemap({
          urls: [
            { url: 'http://test.com/page-1/',  changefreq: 'weekly', priority: 0.3, links: [
              { lang: 'en', url: 'http://test.com/page-1/', },
              { lang: 'ja', url: 'http://test.com/page-1/ja/', },
            ] },
          ]
        });
    assert.eql(smap.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                    '<xhtml:link rel="alternate" hreflang="en" href="http://test.com/page-1/" /> '+
                    '<xhtml:link rel="alternate" hreflang="ja" href="http://test.com/page-1/ja/" /> '+
                '</url>\n'+
              '</urlset>');
  },
  'sitemap: normalize urls, see #39': function() {
    ["http://ya.ru", "http://ya.ru/"].forEach(function(hostname){
      var ssp = new sm.Sitemap(null, hostname);
      ssp.add("page1");
      ssp.add("/page2");

      ssp.toXML(function(err, xml) {
        assert.eql(xml,
          '<?xml version="1.0" encoding="UTF-8"?>\n'+
          urlset + '\n'+
            '<url> '+
                '<loc>http://ya.ru/page1</loc> '+
            '</url>\n'+
            '<url> '+
                '<loc>http://ya.ru/page2</loc> '+
            '</url>\n'+
          '</urlset>');
      });
    })
  },
  'sitemap: langs with hostname': function() {
    var smap = sm.createSitemap({
          hostname: 'http://test.com',
          urls: [
            { url: '/page-1/',  changefreq: 'weekly', priority: 0.3, links: [
              { lang: 'en', url: '/page-1/', },
              { lang: 'ja', url: '/page-1/ja/', },
            ] },
          ]
        });
    assert.eql(smap.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                    '<loc>http://test.com/page-1/</loc> '+
                    '<changefreq>weekly</changefreq> '+
                    '<priority>0.3</priority> '+
                    '<xhtml:link rel="alternate" hreflang="en" href="http://test.com/page-1/" /> '+
                    '<xhtml:link rel="alternate" hreflang="ja" href="http://test.com/page-1/ja/" /> '+
                '</url>\n'+
              '</urlset>');
  },
  'sitemap: error thrown in async-style .toXML()': function() {
    var smap = sm.createSitemap({
      hostname: 'http://test.com',
      urls: [
        { url: '/page-1/', changefreq: 'weekly', priority: 0.3 }
      ]
    });
    smap.toString = sinon.stub();
    var error = new Error('Some error happens');
    smap.toString.throws(error);
    smap.toXML(function (err, xml) {
      assert.eql(err, error);
    });
  },
  'sitemap: android app linking': function() {
    var smap = sm.createSitemap({
          urls: [
            { url: 'http://test.com/page-1/',  changefreq: 'weekly', priority: 0.3,
              androidLink: 'android-app://com.company.test/page-1/' },
            ]
          });
    assert.eql(smap.toString(),
              '<?xml version="1.0" encoding="UTF-8"?>\n'+
              urlset + '\n'+
                '<url> '+
                  '<loc>http://test.com/page-1/</loc> '+
                  '<changefreq>weekly</changefreq> '+
                  '<priority>0.3</priority> '+
                  '<xhtml:link rel="alternate" href="android-app://com.company.test/page-1/" /> '+
                '</url>\n'+
              '</urlset>');
  },
  'sitemap: AMP': function() {
    var smap = sm.createSitemap({
          urls: [
            { url: 'http://test.com/page-1/',  changefreq: 'weekly', priority: 0.3,
              ampLink: 'http://ampproject.org/article.amp.html' },
            ]
          });
    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+ urlset + '\n'+
        '<url> '+
          '<loc>http://test.com/page-1/</loc> '+
          '<changefreq>weekly</changefreq> '+
          '<priority>0.3</priority> '+
          '<xhtml:link rel="amphtml" href="http://ampproject.org/article.amp.html" />'+
        '</url>\n'+
      '</urlset>');
  },
  'sitemap: expires': function() {
    var smap = sm.createSitemap({
          urls: [
            { url: 'http://test.com/page-1/',  changefreq: 'weekly', priority: 0.3,
              expires: new Date('2016-09-13') },
            ]
          });
    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+ urlset + '\n'+
        '<url> '+
          '<loc>http://test.com/page-1/</loc> '+
          '<changefreq>weekly</changefreq> '+
          '<priority>0.3</priority> '+
          '<expires>2016-09-13T00:00:00.000Z</expires> '+
        '</url>\n'+
      '</urlset>');
  },
  'sitemap: image with caption': function() {
    var smap = sm.createSitemap({
      urls: [
        { url: 'http://test.com', img: {url: 'http://test.com/image.jpg?param&otherparam', caption: 'Test Caption'}}
      ]
    });

    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+
      urlset + '\n'+
        '<url> '+
            '<loc>http://test.com</loc> '+
            '<image:image>'+
                '<image:loc>http://test.com/image.jpg?param&amp;otherparam</image:loc>'+
                '<image:caption><![CDATA[Test Caption]]></image:caption>'+
            '</image:image> '+
        '</url>\n'+
      '</urlset>')
  },
  'sitemap: image with caption, title, geo_location, license': function() {
    var smap = sm.createSitemap({
      urls: [
        { url: 'http://test.com',
          img: {
            url: 'http://test.com/image.jpg',
            caption: 'Test Caption',
            title: 'Test title',
            geoLocation: 'Test Geo Location',
            license: 'http://test.com/license.txt',
          }
        }
      ]
    });

    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+
      urlset + '\n'+
        '<url> '+
            '<loc>http://test.com</loc> '+
            '<image:image>'+
                '<image:loc>http://test.com/image.jpg</image:loc>'+
                '<image:caption><![CDATA[Test Caption]]></image:caption>'+
                '<image:geo_location>Test Geo Location</image:geo_location>'+
                '<image:title><![CDATA[Test title]]></image:title>'+
                '<image:license>http://test.com/license.txt</image:license>'+
            '</image:image> '+
        '</url>\n'+
      '</urlset>')
  },
  'sitemap: images with captions': function() {
    var smap = sm.createSitemap({
      urls: [
        { url: 'http://test.com', img: {url: 'http://test.com/image.jpg', caption: 'Test Caption'}},
        { url: 'http://test.com/page2/', img: {url: 'http://test.com/image2.jpg', caption: 'Test Caption 2'}}
      ]
    });

    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+
      urlset + '\n'+
        '<url> '+
            '<loc>http://test.com</loc> '+
            '<image:image>'+
                '<image:loc>http://test.com/image.jpg</image:loc>'+
                '<image:caption><![CDATA[Test Caption]]></image:caption>'+
            '</image:image> '+
        '</url>\n'+
        '<url> '+
            '<loc>http://test.com/page2/</loc> '+
            '<image:image>'+
                '<image:loc>http://test.com/image2.jpg</image:loc>'+
                '<image:caption><![CDATA[Test Caption 2]]></image:caption>'+
            '</image:image> '+
        '</url>\n'+
      '</urlset>')
  },
  'sitemap: images with captions': function() {
    var smap = sm.createSitemap({
      hostname: 'http://test.com',
      urls: [
        {
          url: '/index.html',
          img: [
            {url: 'http://test.com/image.jpg', caption: 'Test Caption'},
            {url: 'http://test.com/image2.jpg', caption: 'Test Caption 2'}
          ]
        }
      ]
    });

    smap.urls.push({url: '/index2.html', img: [{url: '/image3.jpg', caption: 'Test Caption 3'}]});

    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+
      urlset + '\n'+
        '<url> '+
            '<loc>http://test.com/index.html</loc> '+
            '<image:image>'+
                '<image:loc>http://test.com/image.jpg</image:loc>'+
                '<image:caption><![CDATA[Test Caption]]></image:caption>'+
            '</image:image> '+
            '<image:image>'+
                '<image:loc>http://test.com/image2.jpg</image:loc>'+
                '<image:caption><![CDATA[Test Caption 2]]></image:caption>'+
            '</image:image> '+
        '</url>\n'+
        '<url> '+
            '<loc>http://test.com/index2.html</loc> '+
            '<image:image>'+
                '<image:loc>http://test.com/image3.jpg</image:loc>'+
                '<image:caption><![CDATA[Test Caption 3]]></image:caption>'+
            '</image:image> '+
        '</url>\n'+
      '</urlset>');
  },
  'sitemap: video': function() {
    var smap = sm.createSitemap({
      urls: [
        {
          "url":"https://roosterteeth.com/episode/achievement-hunter-achievement-hunter-burnout-paradise-millionaires-club",
          "video":[{
            "title":"2008:E2 - Burnout Paradise: Millionaire's Club",
            "description":"Jack gives us a walkthrough on getting the Millionaire's Club Achievement in Burnout Paradise.",
            "player_loc":"https://roosterteeth.com/embed/achievement-hunter-achievement-hunter-burnout-paradise-millionaires-club?a&b",
            "thumbnail_loc":"https://rtv3-img-roosterteeth.akamaized.net/uploads/images/e82e1925-89dd-4493-9bcf-cdef9665d726/sm/ep298.jpg?a&b",
            "duration":174,
            "publication_date":"2008-07-29T14:58:04.000Z",
            "requires_subscription":false
          }]
        }
      ]
    });

    assert.eql(smap.toString(),
      '<?xml version="1.0" encoding="UTF-8"?>\n'+
      urlset + '\n'+
        '<url> '+
            '<loc>https://roosterteeth.com/episode/achievement-hunter-achievement-hunter-burnout-paradise-millionaires-club</loc> '+
            '<video:video>'+
                '<video:thumbnail_loc>https://rtv3-img-roosterteeth.akamaized.net/uploads/images/e82e1925-89dd-4493-9bcf-cdef9665d726/sm/ep298.jpg?a&amp;b</video:thumbnail_loc>' +
                '<video:title><![CDATA[2008:E2 - Burnout Paradise: Millionaire\'s Club]]></video:title>' +
                '<video:description><![CDATA[Jack gives us a walkthrough on getting the Millionaire\'s Club Achievement in Burnout Paradise.]]></video:description>' +
                '<video:player_loc>https://roosterteeth.com/embed/achievement-hunter-achievement-hunter-burnout-paradise-millionaires-club?a&amp;b</video:player_loc>' +
                '<video:duration>174</video:duration>' +
                '<video:publication_date>2008-07-29T14:58:04.000Z</video:publication_date>' +
            '</video:video> ' +
        '</url>\n'+
      '</urlset>')
  },
  'sitemap: video duration': function() {
    assert.throws( function() {
      var smap = new sm.SitemapItem({
            "url":"https://roosterteeth.com/episode/achievement-hunter-achievement-hunter-burnout-paradise-millionaires-club",
            "video":[{
              "title":"2008:E2 - Burnout Paradise: Millionaire's Club",
              "description":"Jack gives us a walkthrough on getting the Millionaire's Club Achievement in Burnout Paradise.",
              "player_loc":"https://roosterteeth.com/embed/achievement-hunter-achievement-hunter-burnout-paradise-millionaires-club?a&b",
              "thumbnail_loc":"https://rtv3-img-roosterteeth.akamaized.net/uploads/images/e82e1925-89dd-4493-9bcf-cdef9665d726/sm/ep298.jpg?a&b",
              "duration": -1,
              "publication_date":"2008-07-29T14:58:04.000Z",
              "requires_subscription":false
            }]
      });
      smap.toString()
    },
      /duration must be an integer/
    );

  }
}
