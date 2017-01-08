/** Lux Ahoy Dolby build scripts
*   Duplicates makefile for Window development
*/

module.exports = function(grunt) {
  grunt.initConfig({
    dirs: {
      src: 'source',
      includes: 'source/includes',
      dest: 'build'
    },    
    concat: {
      js: {
        // the files to concatenate
        src: ['<%=dirs.src %>/js/Pool.js', '<%=dirs.src %>/js/PoolItem.js', '<%=dirs.src %>/js/Rubble.js', '<%=dirs.src %>/js/*.js', '<%=dirs.src %>/js/postprocessing/shaders/*.js', '<%=dirs.src %>/js/postprocessing/*.js', '<%=dirs.src %>/js/postprocessing/passes/*.js'],
        // the location of the resulting JS file
        dest: '<%= dirs.dest %>/js/engine.js'
      }
    },
    copy: {
      includes: {
        expand: true,                    // required when using cwd
        cwd: '<%=dirs.src %>/includes',  // set working folder / root to copy
        src: '**/*',                     // copy all files and subfolders
        dest: '<%=dirs.dest %>/'         // destination folder
      },
      html: {
        src: '<%=dirs.src %>/html/*.html',
        dest: '<%=dirs.dest %>/',
        expand: true,
        flatten: true
      },
      editor: {
        src: '<%=dirs.src %>/html/edit/*.php',
        dest: '<%=dirs.dest %>/edit/',
        expand: true,
        flatten: true
      },
      update: {
        src: '<%=dirs.src %>/html/update/*.php',
        dest: '<%=dirs.dest %>/update/',
        expand: true,
        flatten: true
      },
      plainJS: {
        cwd: '<%=dirs.src %>/js/plain/',
        src: '**/*',
        dest: '<%=dirs.dest %>/js/',
        expand: true
      }
    },
    compass: {                  // Task
      gameDev: {                // Target
        options: {              // Target options
          sassDir: '<%=dirs.src %>/css',
          cssDir: '<%=dirs.dest %>/css',
          specify: '<%=dirs.src %>/css/style.scss',
          environment: 'development'
        }
      },
      gameDist: {               // Target
        options: {              // Target options
          sassDir: '<%=dirs.src %>/css',
          cssDir: '<%=dirs.dest %>/css',
          specify: '<%=dirs.src %>/css/style.scss',
          environment: 'production'
        }
      },
      editDev: {
        options: {
          sassDir: '<%=dirs.src %>/css',
          cssDir: '<%=dirs.dest %>/css',
          specify: '<%=dirs.src %>/css/editor.scss',
          environment: 'development'
        }
      },
      editDist: {
        options: {
          sassDir: '<%=dirs.src %>/css',
          cssDir: '<%=dirs.dest %>/css',
          specify: '<%=dirs.src %>/css/editor.scss',
          environment: 'production'
        }
      }

    },
    uglify: {
      dist: {
        files: {
          '<%= dirs.dest %>/js/engine.js': ['<%= dirs.dest %>/js/engine.js']
        }
      }
    },
    watch: {
      scripts: {
        files: ['<%=dirs.src %>/js/*.js', '<%=dirs.src %>/js/postprocessing/shaders/*.js', '<%=dirs.src %>/js/postprocessing/*.js', '<%=dirs.src %>/js/postprocessing/passes/*.js'],
        tasks: ['concat:js']
      },
      gameCSS: {
        files: ['<%=dirs.src %>/css/style.scss', '<%=dirs.src %>/css/buttons.scss', '<%=dirs.src %>/css/config.scss'],
        tasks: ['compass:gameDev']
      },
      editCSS: {
        files: ['<%=dirs.src %>/css/editor.scss'],
        tasks: ['compass:editDev']
      },
      html: {
        files: ['<%=dirs.src %>/html/*.html'],
        tasks: ['copy:html']
      },
      includes: {
        files: ['<%=dirs.src %>/includes/**/*'],
        tasks: ['copy:includes']
      },
      editor: {
        files: ['<%=dirs.src %>/html/edit/*.php'],
        tasks: ['copy:editor']
      },
      plainJS: {
        files: ['<%=dirs.src %>/js/plain/*'],
        tasks: ['copy:plainJS']
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  grunt.registerTask('build', ['concat', 'copy', 'uglify', 'compass:gameDist', 'compass:editDist'] );
}