module.exports = (grunt) ->
	grunt.initConfig
		haml:
			dist:
				files:
					'build/demo.html': 'src/demo.html.haml'

		mince:
			js:
				options:
					include: "src/js"
				files: [{
					src: "src/js/demo.js.coffee"
					dest: "build/demo.js"
				}]
			css:
				options:
					include: "src/css"
				files: [{
					src: "src/css/demo.css.sass"
					dest: "build/demo.css"
				}]

		bower:
			install:
				options:
					targetDir: "src/js/lib"

	grunt.loadNpmTasks 'grunt-haml2html'
	grunt.loadNpmTasks 'grunt-mincer'
	grunt.loadNpmTasks 'grunt-bower-task'

	grunt.registerTask 'default', ['mince','haml']
