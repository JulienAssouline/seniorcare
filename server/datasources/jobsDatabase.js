const { DataSource } = require('apollo-datasource')
const authenticate = require('../utils/DSHelperFunctions/authenticate')

const { createSelectQuery, createInsertQuery } = require('../utils/DSHelperFunctions/makeQueries')

class JobsDatabase extends DataSource {
  constructor() {
    super()
  }

  initialize(config) {
    this.context = config.context
  }

  async queryArchiveJobs(input) {

    try {
   
      const ArchiveJob = {
        text: "SELECT * FROM seniorcare.job_posting",
      }
      const result = await this.context.postgres.query(ArchiveJob)

      return result.rows

    } catch(err) {
      throw err
    }
  }

  async deleteit(input){
  
    try{
      const removeJob ={
        text: "DELETE FROM seniorcare.job_posting WHERE ID = $1",
        values : [input.id]
      }
      const result = await this.context.postgres.query(removeJob)

      return input.id

    }catch(err){
      throw err
    }
  }

  async duplicateRepost(input){
    try {
      const getJob = {
        text: `SELECT key_contact_id, title, start_date, end_date, address, city, province, postal_code, availability, hourly_rate, gender_pref, req_drivers_license, cig_smoking, pets, cannabis
        FROM seniorcare.job_posting WHERE id=$1`,
        values : [input.id]
      }
      const result = await this.context.postgres.query(getJob)
      const newJob = {
        ...result.rows[0]
      }
       
      const addNewJob = {
        text:`INSERT INTO seniorcare.job_posting(title, start_date, key_contact_id, end_date, hourly_rate ) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        values:[ newJob.title, newJob.start_date, newJob.key_contact_id, newJob.end_date, newJob.hourly_rate  ]
      }
      const answer = await this.context.postgres.query(addNewJob)
    
      return answer.rows[0]    
    } catch(err) {
      throw err
    }
	}
	
	async addJobRequest(input) {
		try {
			const insertJobObject = {
				...input.basicInformation,
				...input.houseDetails,
				...input.caregiverPreferences,
				key_contact_id: input.key_contact_id,
			}
			const insertJobQuery = createInsertQuery(insertJobObject, 'seniorcare.job_posting')
			const insertJobReturn = await this.context.postgres.query(insertJobQuery)
			return insertJobReturn.rows[0].id
		} catch(err) {
			throw err
		}
	}

	async getJobPost(input) {
		try {
			const { id } = input

			const selectJobsColumns = [
				'id',
				'key_contact_id',
				'date_created',
			]
			const selectJobsQuery = createSelectQuery(selectJobsColumns, 'seniorcare.job_posting', 'id', id)
			const selectJobsResult = await this.context.postgres.query(selectJobsQuery)
			return selectJobsResult.rows[0]
		} catch(err) {
			throw err
		}
	}

	async getJobPosts() {
		try {
			const selectJobsColumns = [
				'id',
				'key_contact_id',
				'date_created',
			]
			const selectJobsQuery = createSelectQuery(selectJobsColumns, 'seniorcare.job_posting')
			const selectJobsResult = await this.context.postgres.query(selectJobsQuery)
			return selectJobsResult.rows
		} catch(err) {
			throw err
		}
	}

	async getBasicInformation(parent) {
		try {
			const { id } = parent
			const selectBasicInfoColumns = [
				'title',
				'start_date',
				'end_date',
				'address',
				'city',
				'province',
				'postal_code',
				'hourly_rate',
			]
			const selectBasicInfoQuery = createSelectQuery(selectBasicInfoColumns, 'seniorcare.job_posting', 'id', id)
			const selectBasicInfoResult = await this.context.postgres.query(selectBasicInfoQuery)
			return selectBasicInfoResult.rows[0]
		} catch(err) {
			throw err
		}
	}

	async getHouseDetails(parent) {
		try {
			const { id } = parent
			const selectHouseDetailsColumns = [
				'cig_smoking',
				'pets',
				'cannabis',
			]
			const selectHouseDetailsQuery = createSelectQuery(selectHouseDetailsColumns, 'seniorcare.job_posting', 'id', id)
			const selectHouseDetailsResult = await this.context.postgres.query(selectHouseDetailsQuery)
			return selectHouseDetailsResult.rows[0]
		} catch(err) {
			throw err
		}
	}

	async getCaregiverPreferences(parent) {
		try {
			const { id } = parent
			const selectCaregiverPrefColumns = [
				'availability',
				'gender_pref',
				'req_drivers_license',
			]
			const selectCaregiverPrefQuery = createSelectQuery(selectCaregiverPrefColumns, 'seniorcare.job_posting', 'id', id)
			const selectCaregiverPrefResult = await this.context.postgres.query(selectCaregiverPrefQuery)
			return selectCaregiverPrefResult.rows[0]
		} catch(err) {
			throw err
		}
	}

	async getKeyContactJobPosts(input) {
		try {
	 		
			const { key_contact_id } = input
		
      const applicantsQuery ={
				text: `SELECT seniorcare.job_posting.id, seniorcare.job_posting.title, seniorcare.job_posting.start_date, seniorcare.job_posting.end_date, seniorcare.job_posting.address, seniorcare.job_posting.city,
				seniorcare.job_posting.province, seniorcare.job_posting.postal_code, seniorcare.job_posting.availability, seniorcare.job_posting.hourly_rate
					FROM seniorcare.applicants 
					INNER JOIN seniorcare.job_posting ON seniorcare.applicants.keycontact_id = 			           	seniorcare.job_posting.key_contact_id
					WHERE  
						seniorcare.applicants.keycontact_id = $1`,
        values : [key_contact_id]
			}
			console.log(key_contact_id)
      const result = await this.context.postgres.query(applicantsQuery)

			console.log('rows in getKeyContactJobPosts', result.rows)
      return result.rows
		} 
		catch(err) {
			console.log("Is error ", err)
      throw err
    }
	}

	async getApplicants(parent) {
    try {
	 
			const { id } = parent

      const applicantsQuery ={
        text: `SELECT * FROM seniorcare.caregiver 
				INNER JOIN seniorcare.applicants ON seniorcare.applicants.caregiver_id = seniorcare.caregiver.id
				WHERE  seniorcare.applicants.jobpost_id = $1`,
        values : [id]
      }
      const result = await this.context.postgres.query(applicantsQuery)
			console.log('results in getApplicants', result.rows)
      return result.rows

		} 
		catch(err) {
			console.log('log my err',err)
      throw err
    }
	}
}

module.exports = JobsDatabase


