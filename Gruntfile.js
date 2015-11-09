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
        src: '<%= dirs.src %>/js/*.js',
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
      }
    },
    compass: {                  // Task
      dev: {                    // Target
        options: {              // Target options
          sassDir: '<%=dirs.src %>/css',
          cssDir: '<%=dirs.dest %>/css',
          specify: '<%=dirs.src %>/css/style.scss',
          environment: 'development'
        }
      },
      dist: {                   // Target
        options: {              // Target options
          sassDir: '<%=dirs.src %>/css',
          cssDir: '<%=dirs.dest %>/css',
          specify: '<%=dirs.src %>/css/style.scss',
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
        files: ['<%=dirs.src %>/js/*.js'],
        tasks: ['concat:js']
      },
      css: {
        files: ['<%=dirs.src %>/css/*.scss'],
        tasks: ['compass:dev']
      },
      html: {
        files: ['<%=dirs.src %>/html/*.html'],
        tasks: ['copy:html']
      },
      includes: {
        files: ['<%=dirs.src %>/includes/**/*'],
        tasks: ['copy:includes']
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  grunt.registerTask('build', ['concat', 'copy', 'uglify', 'compass:dist'] );
}