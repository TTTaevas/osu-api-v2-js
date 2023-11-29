export namespace News {
	/**
	 * Expected from api.getNews(), NewsPostWithContentNavigation
	 */
	export interface Post {
		id: number
		author: string
		/**
		 * Link to view the file on GitHub
		 */
		edit_url: string
		/**
		 * Link to the first image in the document 
		 */
		first_image: string | null
		published_at: Date
		updated_at: Date
		/**
		 * Filename without the extension, used in URLs
		 */
		slug: string
		title: string
	}

	/**
	 * Expected from api.getNewsPost()
	 */
	export interface PostWithContentNavigation extends Post {
		/**
		 * With HTML
		 */
		content: string
		navigation: {
			newer?: Post
			older?: Post
		}
	}
}
