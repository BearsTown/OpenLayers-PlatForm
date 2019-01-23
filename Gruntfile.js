/**
 * http://gruntjs.com/configuring-tasks
 */
module.exports = function (grunt) {
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['Gruntfile.js']
        },
        
        // https://github.com/gruntjs/grunt-contrib-clean
        clean: {
            jsdoc: {
                src: 'apidoc'
            }
        },
        
        // https://github.com/gruntjs/grunt-contrib-uglify
        
        uglify: {
            my_target: {
                options: {
                    sourceMap: true,
                    mangle: true,
                    banner: '/*\n Author: <%=pkg.author%>\n Date: <%= grunt.template.today("yyyy-mm-dd") %> \n*/ '
                },
                files: {
                    'js/uGisMapPlatFormScript.min.js': ['js/uGisMapPlatFormScript-debug.js']
                }
            }
        },

        // https://github.com/gruntjs/grunt-contrib-concat
        concat: {
            my_target: {
                src: [
                	"js/uGisMapPlatForm_grunt.js",
                	"js/src/olPrototype/layer/*.js",
                    "js/src/olPrototype/interaction/*.js",
                    
                    "js/src/*.js",
                	"js/src/uGisUtil/*.js",
                    
                    "js/src/uGisService/*.js",
                    "js/src/uGisService/getCapabilities/uGisGetCapabilitiesDefault.js",
                    "js/src/uGisService/getCapabilities/*.js",
                    
                    "js/src/uGisLayer/uGisLayerDefault.js",
                    "js/src/uGisLayer/*.js",
                    
                    "js/src/uGisTOC/uGisTocDefault.js",
                    "js/src/uGisTOC/*.js",
                    
                    "js/src/uGisBaseMap/uGisBaseMapDefault.js",
                    "js/src/uGisBaseMap/*.js",
                    
                    "js/src/uGisAnimation/animation/featureAnimationDefault.js",
                    "js/src/uGisAnimation/animation/*.js",
                    "js/src/uGisAnimation/shape/uGisShapeAnimationDefault.js",
                    "js/src/uGisAnimation/shape/*.js",
                    
                    "js/src/uGisControl/uGisControlDefault.js",
                    "js/src/uGisControl/uGisDrawFeature.js",
                    "js/src/uGisControl/uGisMeasureDefault.js",
                    "js/src/uGisControl/*.js",
                    
                    "js/src/uGisManager/*.js"
                ],
                dest: 'js/uGisMapPlatFormScript-debug.js' //concat 결과 파일
            }
        },        

        jsdoc: {
            dist: {
                src: [                    
                    "js/src/*.js",
                	"js/src/uGisUtil/*.js",                    
                    "js/src/uGisService/**/*.js",                    
                    "js/src/uGisLayer/**/*.js",                    
                    "js/src/uGisTOC/**/*.js",                    
                    "js/src/uGisBaseMap/**/*.js",                    
                    "js/src/uGisAnimation/**/*.js",                    
                    "js/src/uGisControl/**/*.js",                    
                    "js/src/uGisManager/**/*.js",
                    'nodejs/apidoc/README.md'
                    ],
                options: {
                    destination: 'apidoc',
                    configure: 'nodejs/apidoc/templates/conf.json',
                    template: 'nodejs/apidoc/templates',
                    'private': false
                }
            }
        },

        copy: {
            css: {
                src: 'nodejs/apidoc/templates/static/styles/jaguar.css',
                dest: 'apidoc/styles/jaguar.css'
            },

            js: {
                src: 'nodejs/apidoc/templates/static/scripts/main.js',
                dest: 'apidoc/scripts/main.js'
            }
        }
    });

    // Load task libraries
    [
        'grunt-contrib-connect',
        'grunt-contrib-uglify',
        'grunt-contrib-concat',
        'grunt-contrib-jshint',
        'grunt-contrib-clean',
        'grunt-contrib-copy',
        'grunt-jsdoc'
    ].forEach(function (taskName) {
        grunt.loadNpmTasks(taskName);
    });

    // Definitions of tasks
    grunt.registerTask('default', 'Create olMapPlatForm .js & Documentations', [
        'jshint',
        'concat:my_target',
        'uglify:my_target',
        'clean:jsdoc',
        'jsdoc:dist'
    ]);

    grunt.registerTask('build', 'Build a olMapPlatForm-debug.js Files', [
        'jshint',
        'concat:my_target',
        'uglify:my_target'
    ]);

    grunt.registerTask('doc', 'Create olMapPlatForm Documentations', [
        'clean:jsdoc',
        'jsdoc:dist'
    ]);
};