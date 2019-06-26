import React, { useState } from 'react'
import { ScrollView, Text, View, Image } from 'react-native'
import { Button } from 'react-native-elements'
import { useQuery, useMutation } from 'react-apollo-hooks';
import gql from "graphql-tag";
import styles from '../Styles/Profile/ProfileScreen'
import Icons from 'react-native-vector-icons/FontAwesome5'
import { TouchableOpacity } from 'react-native-gesture-handler';
import { connect } from 'react-redux'
import ImagePicker from 'react-native-image-picker'
import Loading from '../Loading/Loading'
import Amplify, { ConsoleLogger } from '@aws-amplify/core'
import Storage from '@aws-amplify/storage'
import config from '../../../aws-exports'
import RNFetchBlob from 'react-native-fetch-blob';
import files from '../utils/files'

Amplify.configure(config)

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import {
  Container,
  Input,
  Card,
  CardItem
} from 'native-base'

const yellowCurve = require('../../Images/WelcomeScreen/yellow-curve.png')

const mapStateToProps = state => {
  return {
    user_id: state.user_id
  }
}

const GET_KEYCONTACT = gql`
  query getProfile($id: ID!){
    getKeyContactProfile(id: $id){
      fullname
      avatar
      phone_number
      email
      getSeniors {
        id
        fullname
        relation
        birthdate
        avatar
      }
    }
  }
`;

const changeKeyContactAvatar = gql`
  mutation keyContactAvatarVars($input: ProfileDetails!) {
    changeKeyContactAvatar(input: $input) {
      avatar
    }
  }
`

const ProfileScreen = props => {
  let id = props.user_id
  let [avatarSource, setAvatarSource] = useState(null)

  const changeAvatar = useMutation(changeKeyContactAvatar)

  const { data, error, loading } = useQuery(GET_KEYCONTACT, {
    variables: { id }
  })

  if (loading || (data && data.getKeyContactProfile === null)) {
    return (<Loading />)
  }
  if (error) {
    console.log('my error', error)
    return (<Loading />)
  }
  const handleGoToSeniors = () => {
    props.navigation.navigate('Seniors', {
      data: data.getKeyContactProfile
    })
  }


  const handleGoToHelp = () => {
    props.navigation.navigate('Help')
  }


  const handleGoToAccount = (id) => {
    props.navigation.navigate('Account', {
      user_id: id,
      data: data.getKeyContactProfile
    })
  }

  // adding the iOS image picker logic 
  const options = {
    title: 'Select Your Profile Picture',
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  }

  const pickAnImage = id => {
    // let myMutationùfunction = useMutation();
    ImagePicker.showImagePicker(options, response => {
      console.log('Response = ', response)
      if (response.didCancel) {
        console.log('User cancelled image picker')
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error)
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton)
      } else {
        // uploadImageToS3(response.uri)
        RNFetchBlob.config({
          fileCache: true,
          appendExt: 'png',
        })
          .fetch('GET', response.uri, {
          })
          .then((res) => {
            // upload to storage
            files.readFile(res.data)
              .then(buffer =>
                Storage.put('images/avatar/' + (id.substr(0, 8) + ".png"), buffer, { level: 'public', contentType: 'image/png' }))
              .then(async response => {
                const awsImageUrl = await Storage.get(response.key)
                setAvatarSource(awsImageUrl)
                await changeAvatar({
                  variables: { input: { id, avatar: awsImageUrl } },
                  // Optimisitc UI with Apollo
                  optimisticResponse: {
                    __typename: "Mutation",
                    changeKeyContactAvatar: {
                      __typename: "avatar",
                      avatar: awsImageUrl,
                    }
                  },
                  update: (cache, { data: { changeKeyContactAvatar } }) => {
                    // Read the data from our cache for this query.
                    const data = cache.readQuery({ query: GET_KEYCONTACT, variables: { id } });
                    // Write our data back to the cache with the new comment in it
                    cache.writeQuery({
                      query: GET_KEYCONTACT, data: {
                        ...data,
                        avatar: changeKeyContactAvatar.avatar
                      }
                    })
                  },
                })
              }
              )
          })
      }
    })
  }

  return (
    <ScrollView style={styles.MainContainer}>
      <View style={styles.Profile}>
        <TouchableOpacity onPress={() => pickAnImage(id)}>
          <Image style={styles.ProfileImage}
            style={{ width: 200, height: 200, borderRadius: 100 }}
            source={{ uri: (avatarSource == null ? data.getKeyContactProfile.avatar : avatarSource) }}
          />
          <View style={styles.Camera}>
            <Icons name="camera" size={25} color={'#3F7DFB'} />
          </View>
          <Text style={styles.ProfileName}> {data.getKeyContactProfile && data.getKeyContactProfile.fullname} </Text>
        </TouchableOpacity>
      </View>
      <Card style={{ zIndex: 100, position: 'relative', width: wp(90), marginLeft: wp(5) }}>

      <TouchableOpacity
        style={styles.ProfileButton}
        onPress={handleGoToSeniors}
      >
        <Text style={styles.ProfileButtonText}> Seniors</Text>
        <Icons name={`user`} style={styles.ProfileButtonIcon} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ProfileButton}
        onPress={() => handleGoToAccount(id)}
      >
        <Text style={styles.ProfileButtonText}> Account</Text>
        <Icons name={`cog`} style={styles.ProfileButtonIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.ProfileButton} onPress={handleGoToHelp}>
        <Text style={styles.ProfileButtonText}> Help Center</Text>
        <Icons name={`question-circle`} style={styles.ProfileButtonIcon} />
      </TouchableOpacity>
      </Card>
      <Image
        source={yellowCurve}
        style={{ height: hp(44), width: wp(100), zIndex: 0, position: 'relative', padding: 0, margin: 0 }}
      />

    </ScrollView >
  )
}

export default connect(mapStateToProps)(ProfileScreen)




